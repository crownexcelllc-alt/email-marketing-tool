import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { Model } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import { CampaignChannel, CampaignRecipientStatus } from '../campaigns/constants/campaign.enums';
import { CampaignRecipient } from '../campaigns/schemas/campaign-recipient.schema';
import { Campaign } from '../campaigns/schemas/campaign.schema';
import { EmailFailureCategory, EmailSendEventType } from '../email/constants/email.enums';
import { SendEvent } from '../email/schemas/send-event.schema';
import {
  SenderAccount,
  SenderAccountDocument,
} from '../sender-accounts/schemas/sender-account.schema';
import { SenderAccountSecretsService } from '../sender-accounts/sender-account-secrets.service';
import { SenderChannelType } from '../sender-accounts/constants/sender-account.enums';
import {
  WhatsappWebhookMessageStatus,
  WHATSAPP_WEBHOOK_MESSAGE_STATUS_VALUES,
} from './constants/whatsapp-webhook.enums';
import { WhatsappWebhookEvent } from './schemas/whatsapp-webhook-event.schema';

interface WhatsappVerificationInput {
  mode?: string;
  verifyToken?: string;
  challenge?: string;
}

interface ParsedWhatsappStatusEvent {
  providerMessageId: string;
  status: WhatsappWebhookMessageStatus;
  providerTimestamp: Date | null;
  phoneNumberId: string | null;
  recipientPhoneNumber: string | null;
  firstErrorCode: string | null;
  firstErrorMessage: string | null;
  metadata: Record<string, unknown>;
}

interface WebhookProcessResult {
  eventsReceived: number;
  eventsProcessed: number;
  eventsIgnored: number;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(CampaignRecipient.name)
    private readonly campaignRecipientModel: Model<CampaignRecipient>,
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<Campaign>,
    @InjectModel(SendEvent.name)
    private readonly sendEventModel: Model<SendEvent>,
    @InjectModel(SenderAccount.name)
    private readonly senderAccountModel: Model<SenderAccount>,
    @InjectModel(WhatsappWebhookEvent.name)
    private readonly webhookEventModel: Model<WhatsappWebhookEvent>,
    private readonly senderAccountSecretsService: SenderAccountSecretsService,
  ) {}

  async verifyWhatsappWebhook(input: WhatsappVerificationInput): Promise<string> {
    if (input.mode !== 'subscribe' || !input.verifyToken || !input.challenge) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'WHATSAPP_WEBHOOK_VERIFICATION_INVALID_REQUEST',
        'Missing or invalid webhook verification parameters',
      );
    }

    const isValidToken = await this.matchesVerifyToken(input.verifyToken);
    if (!isValidToken) {
      throw new AppException(
        HttpStatus.FORBIDDEN,
        'WHATSAPP_WEBHOOK_VERIFICATION_FAILED',
        'Webhook verify token is invalid',
      );
    }

    return input.challenge;
  }

  async handleWhatsappWebhook(payload: Record<string, unknown>): Promise<WebhookProcessResult> {
    const statusEvents = this.extractStatusEvents(payload);
    if (!statusEvents.length) {
      return {
        eventsReceived: 0,
        eventsProcessed: 0,
        eventsIgnored: 0,
      };
    }

    let eventsProcessed = 0;
    let eventsIgnored = 0;

    for (const event of statusEvents) {
      const outcome = await this.processStatusEvent(event, payload);
      if (outcome === 'processed') {
        eventsProcessed += 1;
      } else {
        eventsIgnored += 1;
      }
    }

    return {
      eventsReceived: statusEvents.length,
      eventsProcessed,
      eventsIgnored,
    };
  }

  private async processStatusEvent(
    event: ParsedWhatsappStatusEvent,
    rawPayload: Record<string, unknown>,
  ): Promise<'processed' | 'ignored'> {
    const eventKey = this.buildEventKey(event);
    const webhookEventBase = {
      eventKey,
      providerMessageId: event.providerMessageId,
      status: event.status,
      providerTimestamp: event.providerTimestamp,
      phoneNumberId: event.phoneNumberId,
      recipientPhoneNumber: event.recipientPhoneNumber,
      metadata: event.metadata,
      rawPayload,
    };

    let webhookEventId = '';
    try {
      const [createdWebhookEvent] = await this.webhookEventModel.create([webhookEventBase]);
      webhookEventId = createdWebhookEvent?._id?.toString() ?? '';
      if (!webhookEventId) {
        throw new Error('Failed to persist WhatsApp webhook event');
      }
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return 'ignored';
      }
      throw error;
    }

    try {
      const recipient = await this.campaignRecipientModel
        .findOne({
          providerMessageId: event.providerMessageId,
          channel: CampaignChannel.WHATSAPP,
        })
        .exec();

      if (!recipient) {
        await this.markWebhookEventError(webhookEventId, 'CAMPAIGN_RECIPIENT_NOT_FOUND');
        return 'ignored';
      }

      const [campaign, senderAccount] = await Promise.all([
        this.campaignModel.findById(recipient.campaignId).exec(),
        this.senderAccountModel.findById(recipient.senderAccountId).exec(),
      ]);

      if (!campaign) {
        await this.markWebhookEventError(webhookEventId, 'CAMPAIGN_NOT_FOUND');
        return 'ignored';
      }

      if (!senderAccount) {
        await this.markWebhookEventError(webhookEventId, 'SENDER_ACCOUNT_NOT_FOUND');
        return 'ignored';
      }

      if (
        event.phoneNumberId &&
        senderAccount.whatsapp?.phoneNumberId &&
        event.phoneNumberId !== senderAccount.whatsapp.phoneNumberId
      ) {
        await this.markWebhookEventError(webhookEventId, 'WHATSAPP_PHONE_NUMBER_ID_MISMATCH');
        return 'ignored';
      }

      const counterField = this.getCounterFieldForStatus(event.status);
      const statsInc: Record<string, number> = {
        [counterField]: 1,
      };
      const providerTimestamp = event.providerTimestamp ?? new Date();

      this.applyRecipientStatusTransition(recipient, event, statsInc, providerTimestamp);
      await recipient.save();

      await this.campaignModel
        .updateOne(
          { _id: campaign._id },
          {
            $inc: this.removeZeroIncrements(statsInc),
            $set: {
              'stats.lastWhatsappStatusAt': providerTimestamp,
            },
          },
        )
        .exec();

      await this.sendEventModel.create({
        workspaceId: recipient.workspaceId,
        campaignId: recipient.campaignId,
        campaignRecipientId: recipient._id,
        senderAccountId: recipient.senderAccountId,
        contactId: recipient.contactId,
        channel: CampaignChannel.WHATSAPP,
        address: recipient.address,
        eventType: this.mapStatusToSendEventType(event.status),
        failureCategory:
          event.status === WhatsappWebhookMessageStatus.FAILED
            ? EmailFailureCategory.PERMANENT
            : null,
        failureCode: event.firstErrorCode ?? '',
        failureMessage: event.firstErrorMessage ?? '',
        smtpResponseCode: null,
        providerMessageId: event.providerMessageId,
        attempt: 1,
        maxAttempts: 1,
        retryScheduled: false,
        hardBounceCandidate: false,
        metadata: event.metadata,
      });

      await this.webhookEventModel
        .updateOne(
          { _id: webhookEventId },
          {
            $set: {
              campaignId: recipient.campaignId,
              campaignRecipientId: recipient._id,
              contactId: recipient.contactId,
              senderAccountId: recipient.senderAccountId,
              processed: true,
              processingError: '',
            },
          },
        )
        .exec();

      return 'processed';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown webhook processing error';
      await this.markWebhookEventError(webhookEventId, message);
      this.logger.warn(
        `Failed WhatsApp webhook event processing providerMessageId=${event.providerMessageId} status=${event.status}: ${message}`,
      );
      return 'ignored';
    }
  }

  private applyRecipientStatusTransition(
    recipient: CampaignRecipient,
    event: ParsedWhatsappStatusEvent,
    statsInc: Record<string, number>,
    eventTimestamp: Date,
  ): void {
    const currentStatus = recipient.status;

    if (event.status === WhatsappWebhookMessageStatus.FAILED) {
      if (currentStatus !== CampaignRecipientStatus.FAILED) {
        if (currentStatus === CampaignRecipientStatus.SENT) {
          statsInc['stats.sentRecipients'] = (statsInc['stats.sentRecipients'] ?? 0) - 1;
        }

        statsInc['stats.failedRecipients'] = (statsInc['stats.failedRecipients'] ?? 0) + 1;
      }

      recipient.status = CampaignRecipientStatus.FAILED;
      recipient.failedAt = eventTimestamp;
      recipient.failureReason =
        event.firstErrorMessage ?? 'WhatsApp provider reported message delivery failure';
      return;
    }

    if (currentStatus === CampaignRecipientStatus.FAILED) {
      statsInc['stats.failedRecipients'] = (statsInc['stats.failedRecipients'] ?? 0) - 1;
      statsInc['stats.sentRecipients'] = (statsInc['stats.sentRecipients'] ?? 0) + 1;
    } else if (currentStatus !== CampaignRecipientStatus.SENT) {
      statsInc['stats.sentRecipients'] = (statsInc['stats.sentRecipients'] ?? 0) + 1;
    }

    recipient.status = CampaignRecipientStatus.SENT;
    recipient.sentAt = recipient.sentAt ?? eventTimestamp;
    recipient.failedAt = null;
    recipient.failureReason = '';
  }

  private extractStatusEvents(payload: Record<string, unknown>): ParsedWhatsappStatusEvent[] {
    const events: ParsedWhatsappStatusEvent[] = [];
    const entries = Array.isArray(payload.entry) ? payload.entry : [];

    for (const entry of entries) {
      const entryObj = this.asRecord(entry);
      if (!entryObj) {
        continue;
      }

      const changes = Array.isArray(entryObj.changes) ? entryObj.changes : [];
      for (const change of changes) {
        const changeObj = this.asRecord(change);
        if (!changeObj) {
          continue;
        }

        const value = this.asRecord(changeObj.value);
        if (!value) {
          continue;
        }

        const metadata = this.asRecord(value.metadata);
        const phoneNumberId = this.toNullableTrimmedString(metadata?.phone_number_id);
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];

        for (const statusItem of statuses) {
          const statusObj = this.asRecord(statusItem);
          if (!statusObj) {
            continue;
          }

          const status = this.normalizeMessageStatus(statusObj.status);
          if (!status) {
            continue;
          }

          const providerMessageId = this.toNullableTrimmedString(statusObj.id);
          if (!providerMessageId) {
            continue;
          }

          const providerTimestamp = this.parseTimestamp(statusObj.timestamp);
          const firstError = this.extractFirstError(statusObj.errors);

          events.push({
            providerMessageId,
            status,
            providerTimestamp,
            phoneNumberId,
            recipientPhoneNumber: this.toNullableTrimmedString(statusObj.recipient_id),
            firstErrorCode: firstError.code,
            firstErrorMessage: firstError.message,
            metadata: {
              valueMetadata: value,
              statusPayload: statusObj,
            },
          });
        }
      }
    }

    return events;
  }

  private async matchesVerifyToken(token: string): Promise<boolean> {
    const configuredToken = this.configService.get<string>('webhooks.whatsappVerifyToken', {
      infer: true,
    });

    if (configuredToken?.trim() && configuredToken.trim() === token.trim()) {
      return true;
    }

    const senderAccounts = await this.senderAccountModel
      .find({ channelType: SenderChannelType.WHATSAPP })
      .select('+secrets.webhookVerifyTokenEncrypted')
      .exec();

    for (const account of senderAccounts) {
      if (this.matchesSenderWebhookToken(account, token)) {
        return true;
      }
    }

    return false;
  }

  private matchesSenderWebhookToken(senderAccount: SenderAccountDocument, token: string): boolean {
    const encrypted = senderAccount.secrets?.webhookVerifyTokenEncrypted;
    if (!encrypted) {
      return false;
    }

    try {
      const decrypted = this.senderAccountSecretsService.decrypt(encrypted);
      return decrypted.trim() === token.trim();
    } catch {
      return false;
    }
  }

  private getCounterFieldForStatus(status: WhatsappWebhookMessageStatus): string {
    switch (status) {
      case WhatsappWebhookMessageStatus.SENT:
        return 'stats.whatsappSentCount';
      case WhatsappWebhookMessageStatus.DELIVERED:
        return 'stats.whatsappDeliveredCount';
      case WhatsappWebhookMessageStatus.READ:
        return 'stats.whatsappReadCount';
      case WhatsappWebhookMessageStatus.FAILED:
        return 'stats.whatsappFailedCount';
      default:
        return 'stats.whatsappSentCount';
    }
  }

  private mapStatusToSendEventType(status: WhatsappWebhookMessageStatus): EmailSendEventType {
    switch (status) {
      case WhatsappWebhookMessageStatus.SENT:
        return EmailSendEventType.WHATSAPP_STATUS_SENT;
      case WhatsappWebhookMessageStatus.DELIVERED:
        return EmailSendEventType.WHATSAPP_STATUS_DELIVERED;
      case WhatsappWebhookMessageStatus.READ:
        return EmailSendEventType.WHATSAPP_STATUS_READ;
      case WhatsappWebhookMessageStatus.FAILED:
        return EmailSendEventType.WHATSAPP_STATUS_FAILED;
      default:
        return EmailSendEventType.WHATSAPP_STATUS_SENT;
    }
  }

  private extractFirstError(errors: unknown): { code: string | null; message: string | null } {
    const errorArray = Array.isArray(errors) ? errors : [];
    const first = this.asRecord(errorArray[0]);
    if (!first) {
      return { code: null, message: null };
    }

    const codeValue = first.code;
    const code =
      typeof codeValue === 'number' || typeof codeValue === 'string' ? String(codeValue) : null;
    const message =
      this.toNullableTrimmedString(first.message) ??
      this.toNullableTrimmedString(first.title) ??
      this.toNullableTrimmedString(this.asRecord(first.error_data)?.details);

    return { code, message };
  }

  private parseTimestamp(value: unknown): Date | null {
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
      const seconds = Number(value.trim());
      if (Number.isFinite(seconds) && seconds > 0) {
        return new Date(seconds * 1000);
      }
    }

    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return new Date(value * 1000);
    }

    return null;
  }

  private normalizeMessageStatus(value: unknown): WhatsappWebhookMessageStatus | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim().toLowerCase();
    if (
      (WHATSAPP_WEBHOOK_MESSAGE_STATUS_VALUES as string[]).includes(
        normalized as WhatsappWebhookMessageStatus,
      )
    ) {
      return normalized as WhatsappWebhookMessageStatus;
    }

    return null;
  }

  private buildEventKey(event: ParsedWhatsappStatusEvent): string {
    const raw = JSON.stringify({
      providerMessageId: event.providerMessageId,
      status: event.status,
      providerTimestamp: event.providerTimestamp?.toISOString() ?? '',
      phoneNumberId: event.phoneNumberId ?? '',
      recipientPhoneNumber: event.recipientPhoneNumber ?? '',
      firstErrorCode: event.firstErrorCode ?? '',
      firstErrorMessage: event.firstErrorMessage ?? '',
    });

    return createHash('sha256').update(raw).digest('hex');
  }

  private async markWebhookEventError(eventId: string, processingError: string): Promise<void> {
    await this.webhookEventModel
      .updateOne(
        { _id: eventId },
        {
          $set: {
            processed: false,
            processingError,
          },
        },
      )
      .exec();
  }

  private removeZeroIncrements(input: Record<string, number>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== 0) {
        result[key] = value;
      }
    }
    return result;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return Boolean(
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000,
    );
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private toNullableTrimmedString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
