import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Transporter, createTransport } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { Model, Types } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import {
  CAMPAIGN_STOP_REASON_DAILY_LIMIT,
  CampaignChannel,
  DAILY_LIMIT_FAILURE_PATTERN,
  CampaignRecipientStatus,
  CampaignStatus,
} from '../campaigns/constants/campaign.enums';
import {
  CampaignRecipient,
  CampaignRecipientDocument,
} from '../campaigns/schemas/campaign-recipient.schema';
import { Campaign, CampaignDocument } from '../campaigns/schemas/campaign.schema';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import {
  SenderAccountStatus,
  SenderChannelType,
} from '../sender-accounts/constants/sender-account.enums';
import {
  SenderAccount,
  SenderAccountDocument,
} from '../sender-accounts/schemas/sender-account.schema';
import { SenderAccountSecretsService } from '../sender-accounts/sender-account-secrets.service';
import { SuppressionChannel } from '../suppression/constants/suppression.enums';
import { SuppressionService } from '../suppression/suppression.service';
import { TemplateChannelType } from '../templates/constants/template.enums';
import { Template, TemplateDocument } from '../templates/schemas/template.schema';
import { TrackingLinkService } from '../tracking/tracking-link.service';
import { EmailFailureCategory, EmailSendEventType } from './constants/email.enums';
import { classifyEmailFailure, EmailFailureClassification } from './email-failure.utils';
import {
  injectEmailTrackingPlaceholders,
  renderEmailTemplateWithContact,
} from './email-template.utils';
import { SendEvent } from './schemas/send-event.schema';

export interface EmailSendWorkerInput {
  campaignId: string;
  campaignRecipientId: string;
  senderAccountId: string;
  contactId: string;
}

export type EmailSendProcessOutcome =
  | { type: 'success' }
  | { type: 'retryable_failure'; message: string }
  | { type: 'permanent_failure'; message: string }
  | {
      type: 'rate_limited';
      message: string;
      campaignId: string;
      workspaceId: string;
      resumeAt: string;
    }
  | { type: 'suppressed' }
  | { type: 'noop' };

export interface EmailSendAttemptContext {
  attempt: number;
  maxAttempts: number;
}

interface EmailSendContext {
  workspaceId: Types.ObjectId;
  campaign: CampaignDocument;
  recipient: CampaignRecipientDocument;
  senderAccount: SenderAccountDocument;
  template: TemplateDocument;
  contact: ContactDocument;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly limitResetDelayMs =
    Math.max(1, Number(process.env.CAMPAIGN_LIMIT_RESET_DELAY_MINUTES ?? 24 * 60)) * 60 * 1000;

  constructor(
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<Campaign>,
    @InjectModel(CampaignRecipient.name)
    private readonly campaignRecipientModel: Model<CampaignRecipient>,
    @InjectModel(SenderAccount.name)
    private readonly senderAccountModel: Model<SenderAccount>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<Template>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<Contact>,
    @InjectModel(SendEvent.name)
    private readonly sendEventModel: Model<SendEvent>,
    private readonly senderAccountSecretsService: SenderAccountSecretsService,
    private readonly suppressionService: SuppressionService,
    private readonly trackingLinkService: TrackingLinkService,
  ) {}

  health(): { module: string; status: string; next: string } {
    return {
      module: 'email',
      status: 'ready',
      next: 'Email send worker engine is active.',
    };
  }

  async processSendJob(
    input: EmailSendWorkerInput,
    ctx: EmailSendAttemptContext,
  ): Promise<EmailSendProcessOutcome> {
    const context = await this.loadContext(input);

    if (context.campaign.status !== CampaignStatus.RUNNING) {
      if (
        context.campaign.status === CampaignStatus.CANCELLED ||
        context.campaign.status === CampaignStatus.COMPLETED
      ) {
        await this.recordSendEvent({
          context,
          eventType: EmailSendEventType.SEND_FAILED_PERMANENT,
          failureCategory: EmailFailureCategory.PERMANENT,
          failureCode: 'CAMPAIGN_NOT_SENDABLE',
          failureMessage: 'Campaign is not in sendable state',
          attempt: ctx.attempt,
          maxAttempts: ctx.maxAttempts,
        });
      } else if (context.campaign.status === CampaignStatus.PAUSED) {
        await this.campaignRecipientModel
          .updateOne(
            {
              _id: context.recipient._id,
              status: {
                $in: [
                  CampaignRecipientStatus.PENDING,
                  CampaignRecipientStatus.QUEUED,
                  CampaignRecipientStatus.SENDING,
                ],
              },
            },
            {
              $set: {
                status: CampaignRecipientStatus.PENDING,
                failureReason: '',
              },
            },
          )
          .exec();
      }
      return { type: 'noop' };
    }

    if (
      context.recipient.status === CampaignRecipientStatus.SENT ||
      context.recipient.status === CampaignRecipientStatus.CANCELLED
    ) {
      return { type: 'noop' };
    }

    await this.recordSendEvent({
      context,
      eventType: EmailSendEventType.SEND_ATTEMPT,
      attempt: ctx.attempt,
      maxAttempts: ctx.maxAttempts,
    });

    const suppression = await this.suppressionService.checkSuppression(
      context.workspaceId.toString(),
      SuppressionChannel.EMAIL,
      {
        contactId: context.contact._id.toString(),
        email: context.contact.email ?? null,
      },
    );

    if (suppression.suppressed) {
      await this.markRecipientSuppressed(context);
      await this.recordSendEvent({
        context,
        eventType: EmailSendEventType.SEND_SKIPPED_SUPPRESSED,
        failureCategory: EmailFailureCategory.PERMANENT,
        failureCode: 'SUPPRESSED',
        failureMessage: 'Contact is in suppression list for email',
        attempt: ctx.attempt,
        maxAttempts: ctx.maxAttempts,
      });
      return { type: 'suppressed' };
    }

    const updateResult = await this.campaignRecipientModel
      .updateOne(
        {
          _id: context.recipient._id,
          status: { $in: [CampaignRecipientStatus.QUEUED, CampaignRecipientStatus.SENDING] },
        },
        {
          $set: {
            status: CampaignRecipientStatus.SENDING,
            failureReason: '',
            lastAttemptAt: new Date(),
          },
        },
      )
      .exec();

    if (updateResult.modifiedCount === 0) {
      return { type: 'noop' };
    }

    try {
      const transporter = this.createTransporter(context.senderAccount);
      const rendered = this.renderTemplate(context);
      const withTrackingPlaceholders = injectEmailTrackingPlaceholders({
        html: rendered.html,
        text: rendered.text,
        trackOpens: context.campaign.trackOpens,
        trackClicks: context.campaign.trackClicks,
      });
      const tracked = this.trackingLinkService.applyTrackingToEmailContent({
        html: withTrackingPlaceholders.html,
        text: withTrackingPlaceholders.text,
        trackOpens: context.campaign.trackOpens,
        trackClicks: context.campaign.trackClicks,
        campaignId: context.campaign._id.toString(),
        campaignRecipientId: context.recipient._id.toString(),
        contactId: context.contact._id.toString(),
        trackingBaseUrl: process.env.TRACKING_BASE_URL || context.campaign.trackingBaseUrl,
      });
      const trackingDiagnostics = {
        opensEnabled: context.campaign.trackOpens,
        clicksEnabled: context.campaign.trackClicks,
        openPixelInjected: Boolean(
          tracked.openPixelUrl && tracked.html.includes(tracked.openPixelUrl),
        ),
        trackedHtmlLinkCount: this.countTrackedLinks(tracked.html),
        trackedTextLinkCount: this.countTrackedLinks(tracked.text),
      };

      const sendResult = await transporter.sendMail({
        from: this.buildFromAddress(context.senderAccount),
        to: context.contact.email as string,
        subject: rendered.subject,
        html: tracked.html,
        text: tracked.text,
        headers: {
          'X-Campaign-Id': context.campaign._id.toString(),
          'X-Campaign-Recipient-Id': context.recipient._id.toString(),
          'X-Contact-Id': context.contact._id.toString(),
          'X-Sender-Account-Id': context.senderAccount._id.toString(),
        },
      });

      const updateSentResult = await this.campaignRecipientModel
        .updateOne(
          {
            _id: context.recipient._id,
            status: CampaignRecipientStatus.SENDING,
          },
          {
            $set: {
              status: CampaignRecipientStatus.SENT,
              sentAt: new Date(),
              providerMessageId: sendResult.messageId ?? null,
              failedAt: null,
              failureReason: '',
            },
          },
        )
        .exec();

      if (updateSentResult.modifiedCount === 0) {
        return { type: 'noop' };
      }

      await this.campaignModel
        .updateOne(
          { _id: context.campaign._id },
          {
            $inc: {
              'stats.sentRecipients': 1,
              'stats.queuedRecipients': -1,
            },
          },
        )
        .exec();

      await this.tryMarkCampaignCompleted(context.campaign._id);

      await this.recordSendEvent({
        context,
        eventType: EmailSendEventType.SEND_SUCCESS,
        providerMessageId: sendResult.messageId ?? null,
        attempt: ctx.attempt,
        maxAttempts: ctx.maxAttempts,
        metadata: {
          unresolvedVariables: rendered.unresolvedVariables,
          tracking: trackingDiagnostics,
        },
      });

      return { type: 'success' };
    } catch (error) {
      const failure = classifyEmailFailure(error);
      const isLimitError = this.isDailyLimitError(failure);
      const retriesRemaining = ctx.attempt < ctx.maxAttempts;

      if (isLimitError) {
        const resumeAt = await this.handleDailyLimitReached(context, failure);

        await this.recordSendEvent({
          context,
          eventType: EmailSendEventType.SEND_FAILED_TEMPORARY,
          failureCategory: EmailFailureCategory.TEMPORARY,
          failureCode: failure.code,
          failureMessage: failure.message,
          smtpResponseCode: failure.smtpResponseCode,
          attempt: ctx.attempt,
          maxAttempts: ctx.maxAttempts,
          hardBounceCandidate: false,
        });

        this.logger.warn(
          `Daily limit reached campaign=${context.campaign._id.toString()} recipient=${context.recipient._id.toString()} resumeAt=${resumeAt.toISOString()}`,
        );

        return {
          type: 'rate_limited',
          message: `${failure.code}: ${failure.message}`,
          campaignId: context.campaign._id.toString(),
          workspaceId: context.workspaceId.toString(),
          resumeAt: resumeAt.toISOString(),
        };
      }

      if (failure.category === EmailFailureCategory.TEMPORARY && retriesRemaining) {
        await this.campaignRecipientModel
          .updateOne(
            { _id: context.recipient._id },
            {
              $set: {
                status: CampaignRecipientStatus.QUEUED,
                providerMessageId: null,
                failureReason: `${failure.code}: ${failure.message}`,
                failedAt: null,
              },
            },
          )
          .exec();

        await this.recordSendEvent({
          context,
          eventType: EmailSendEventType.SEND_RETRY_SCHEDULED,
          failureCategory: failure.category,
          failureCode: failure.code,
          failureMessage: failure.message,
          smtpResponseCode: failure.smtpResponseCode,
          attempt: ctx.attempt,
          maxAttempts: ctx.maxAttempts,
          retryScheduled: true,
        });

        return {
          type: 'retryable_failure',
          message: `${failure.code}: ${failure.message}`,
        };
      }

      const eventType =
        failure.category === EmailFailureCategory.TEMPORARY
          ? EmailSendEventType.SEND_FAILED_TEMPORARY
          : EmailSendEventType.SEND_FAILED_PERMANENT;

      await this.campaignRecipientModel
        .updateOne(
          { _id: context.recipient._id },
          {
            $set: {
              status: CampaignRecipientStatus.FAILED,
              providerMessageId: null,
              failureReason: `${failure.code}: ${failure.message}`,
              failedAt: new Date(),
            },
          },
        )
        .exec();

      const incFields: Record<string, number> = {
        'stats.failedRecipients': 1,
        'stats.queuedRecipients': -1,
      };

      await this.campaignModel
        .updateOne(
          { _id: context.campaign._id },
          { $inc: incFields },
        )
        .exec();

      await this.tryMarkCampaignCompleted(context.campaign._id);

      await this.recordSendEvent({
        context,
        eventType,
        failureCategory: failure.category,
        failureCode: failure.code,
        failureMessage: failure.message,
        smtpResponseCode: failure.smtpResponseCode,
        attempt: ctx.attempt,
        maxAttempts: ctx.maxAttempts,
        hardBounceCandidate: failure.hardBounceCandidate,
      });

      this.logger.warn(
        `Email send failed campaignRecipient=${context.recipient._id.toString()} category=${failure.category} code=${failure.code} hardBounceCandidate=${failure.hardBounceCandidate}`,
      );

      return {
        type: 'permanent_failure',
        message: `${failure.code}: ${failure.message}`,
      };
    }
  }

  async markJobAsFailedForNonRetryableError(
    input: EmailSendWorkerInput,
    reason: string,
  ): Promise<void> {
    let campaignId: Types.ObjectId;
    let campaignRecipientId: Types.ObjectId;
    let senderAccountId: Types.ObjectId;
    let contactId: Types.ObjectId;

    try {
      campaignId = this.toObjectId(input.campaignId, 'INVALID_CAMPAIGN_ID');
      campaignRecipientId = this.toObjectId(
        input.campaignRecipientId,
        'INVALID_CAMPAIGN_RECIPIENT_ID',
      );
      senderAccountId = this.toObjectId(input.senderAccountId, 'INVALID_SENDER_ACCOUNT_ID');
      contactId = this.toObjectId(input.contactId, 'INVALID_CONTACT_ID');
    } catch {
      return;
    }

    const failureReason = `SEND_ABORTED: ${reason}`.slice(0, 500);
    const updateResult = await this.campaignRecipientModel
      .updateOne(
        {
          _id: campaignRecipientId,
          campaignId,
          senderAccountId,
          contactId,
          status: {
            $in: [
              CampaignRecipientStatus.PENDING,
              CampaignRecipientStatus.QUEUED,
              CampaignRecipientStatus.SENDING,
            ],
          },
        },
        {
          $set: {
            status: CampaignRecipientStatus.FAILED,
            providerMessageId: null,
            failureReason,
            failedAt: new Date(),
          },
        },
      )
      .exec();

    if (!updateResult.modifiedCount) {
      return;
    }

    await this.campaignModel
      .updateOne(
        { _id: campaignId },
        {
          $inc: {
            'stats.failedRecipients': 1,
            'stats.queuedRecipients': -1,
          },
        },
      )
      .exec();

    await this.tryMarkCampaignCompleted(campaignId);
  }

  private async loadContext(input: EmailSendWorkerInput): Promise<EmailSendContext> {
    const campaignId = this.toObjectId(input.campaignId, 'INVALID_CAMPAIGN_ID');
    const campaignRecipientId = this.toObjectId(
      input.campaignRecipientId,
      'INVALID_CAMPAIGN_RECIPIENT_ID',
    );
    const senderAccountId = this.toObjectId(input.senderAccountId, 'INVALID_SENDER_ACCOUNT_ID');
    const contactId = this.toObjectId(input.contactId, 'INVALID_CONTACT_ID');

    const recipient = await this.campaignRecipientModel.findById(campaignRecipientId).exec();
    if (!recipient) {
      throw new AppException(
        HttpStatus.NOT_FOUND,
        'CAMPAIGN_RECIPIENT_NOT_FOUND',
        'Campaign recipient not found',
      );
    }

    if (recipient.campaignId.toString() !== campaignId.toString()) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_RECIPIENT_CAMPAIGN_MISMATCH',
        'Campaign recipient does not belong to campaign',
      );
    }

    if (recipient.senderAccountId.toString() !== senderAccountId.toString()) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_RECIPIENT_SENDER_MISMATCH',
        'Campaign recipient sender mismatch',
      );
    }

    if (recipient.contactId.toString() !== contactId.toString()) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_RECIPIENT_CONTACT_MISMATCH',
        'Campaign recipient contact mismatch',
      );
    }

    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) {
      throw new AppException(HttpStatus.NOT_FOUND, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
    }

    if (campaign.channel !== CampaignChannel.EMAIL) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_CHANNEL_NOT_EMAIL',
        'Email worker received non-email campaign',
      );
    }

    const senderAccount = await this.senderAccountModel
      .findOne({
        _id: senderAccountId,
        workspaceId: campaign.workspaceId,
        channelType: SenderChannelType.EMAIL,
      })
      .select('+secrets.smtpPassEncrypted')
      .exec();

    if (!senderAccount || !senderAccount.email || !senderAccount.secrets?.smtpPassEncrypted) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'EMAIL_SENDER_CONFIG_INVALID',
        'Email sender account configuration is missing',
      );
    }

    if (senderAccount.status !== SenderAccountStatus.ACTIVE) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'EMAIL_SENDER_INACTIVE',
        'Email sender account is not active',
      );
    }

    const template = await this.templateModel
      .findOne({
        _id: campaign.templateId,
        workspaceId: campaign.workspaceId,
        channelType: TemplateChannelType.EMAIL,
      })
      .exec();

    if (!template || !template.email) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'EMAIL_TEMPLATE_NOT_FOUND',
        'Email template not found for campaign',
      );
    }

    const contact = await this.contactModel
      .findOne({
        _id: contactId,
        workspaceId: campaign.workspaceId,
      })
      .exec();

    if (!contact || !contact.email) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'EMAIL_CONTACT_INVALID',
        'Contact is missing a valid email address',
      );
    }

    return {
      workspaceId: campaign.workspaceId,
      campaign,
      recipient,
      senderAccount,
      template,
      contact,
    };
  }

  private createTransporter(senderAccount: SenderAccountDocument): Transporter {
    const emailConfig = senderAccount.email;
    const encryptedSmtpPass = senderAccount.secrets.smtpPassEncrypted;

    if (!emailConfig || !encryptedSmtpPass) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'EMAIL_SENDER_CREDENTIALS_MISSING',
        'Sender SMTP configuration is incomplete',
      );
    }

    const smtpPass = this.senderAccountSecretsService.decrypt(encryptedSmtpPass);
    const transportOptions: SMTPTransport.Options = {
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpPort === 465,
      auth: {
        user: emailConfig.smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    };

    return createTransport(transportOptions);
  }

  private renderTemplate(context: {
    template: TemplateDocument;
    contact: ContactDocument;
    campaign: CampaignDocument;
  }): {
    subject: string;
    html: string;
    text: string;
    unresolvedVariables: string[];
  } {
    const template = context.template.email;
    if (!template) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'EMAIL_TEMPLATE_CONTENT_MISSING',
        'Email template content is missing',
      );
    }

    const contactData = {
      // Top-level contact fields
      firstName: context.contact.firstName,
      lastName: context.contact.lastName,
      fullName: context.contact.fullName,
      email: context.contact.email,
      phone: context.contact.phone, // "Mobile" field in Add Contact form
      company: context.contact.company,
      category: context.contact.category,
      labels: context.contact.labels,
      // Custom fields from Add Contact form
      country: context.contact.customFields?.country ?? '',
      telephone: context.contact.customFields?.telephone ?? '',
      additionalNumber: context.contact.customFields?.additionalNumber ?? '',
      designation: context.contact.customFields?.designation ?? '',
      department: context.contact.customFields?.department ?? '',
      city: context.contact.customFields?.city ?? '',
      leadSource: context.contact.customFields?.leadSource ?? '', // "Source" field in Add Contact form
      // Raw customFields object (for advanced access)
      customFields: context.contact.customFields,
      // Campaign context
      campaign: {
        id: context.campaign._id.toString(),
        name: context.campaign.name,
      },
      // Template metadata
      template: {
        id: context.template._id.toString(),
        name: context.template.name,
      },
      templateName: context.template.name,
    } as Record<string, unknown>;

    return renderEmailTemplateWithContact(
      template.subject,
      template.htmlBody,
      template.textBody || '',
      contactData,
    );
  }

  private buildFromAddress(senderAccount: SenderAccountDocument): string {
    const senderEmail = senderAccount.email?.email;
    if (!senderEmail) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'EMAIL_SENDER_FROM_MISSING',
        'Sender account email is missing',
      );
    }

    return `"${senderAccount.name}" <${senderEmail}>`;
  }

  private countTrackedLinks(content: string): number {
    const matches = content.match(/\/tracking\/click\//g);
    return matches?.length ?? 0;
  }

  private async markRecipientSuppressed(context: EmailSendContext): Promise<void> {
    await this.campaignRecipientModel
      .updateOne(
        { _id: context.recipient._id },
        {
          $set: {
            status: CampaignRecipientStatus.SKIPPED,
            providerMessageId: null,
            failureReason: 'Suppressed recipient',
            failedAt: null,
          },
        },
      )
      .exec();

    await this.campaignModel
      .updateOne(
        { _id: context.campaign._id },
        {
          $inc: {
            'stats.skippedRecipients': 1,
            'stats.queuedRecipients': -1,
          },
        },
      )
      .exec();

    await this.tryMarkCampaignCompleted(context.campaign._id);
  }

  private isDailyLimitError(failure: EmailFailureClassification): boolean {
    return DAILY_LIMIT_FAILURE_PATTERN.test(`${failure.code} ${failure.message}`);
  }

  private async resolveDailyLimitResumeAt(campaign: CampaignDocument, now: Date): Promise<Date> {
    const latest = await this.campaignModel.findById(campaign._id).select('limitResumeAt').exec();
    if (latest && latest.limitResumeAt) {
      return new Date(latest.limitResumeAt);
    }

    return new Date(now.getTime() + this.limitResetDelayMs);
  }

  private async handleDailyLimitReached(
    context: EmailSendContext,
    failure: EmailFailureClassification,
  ): Promise<Date> {
    const now = new Date();
    const resumeAt = await this.resolveDailyLimitResumeAt(context.campaign, now);
    const failureReason = `${failure.code}: ${failure.message}`;

    await this.campaignRecipientModel
      .updateOne(
        {
          _id: context.recipient._id,
          status: CampaignRecipientStatus.SENDING,
        },
        {
          $set: {
            status: CampaignRecipientStatus.PENDING,
            providerMessageId: null,
            failureReason,
            failedAt: null,
          },
        },
      )
      .exec();

    await this.campaignRecipientModel
      .updateMany(
        {
          campaignId: context.campaign._id,
          status: CampaignRecipientStatus.QUEUED,
        },
        {
          $set: {
            status: CampaignRecipientStatus.PENDING,
            failedAt: null,
          },
        },
      )
      .exec();

    const remainingCount = await this.campaignRecipientModel
      .countDocuments({
        campaignId: context.campaign._id,
        status: {
          $in: [
            CampaignRecipientStatus.PENDING,
            CampaignRecipientStatus.QUEUED,
            CampaignRecipientStatus.SENDING,
          ],
        },
      })
      .exec();

    const setFields: Record<string, unknown> = {
      status: CampaignStatus.PAUSED,
      stoppedAt: now,
      stopReason: CAMPAIGN_STOP_REASON_DAILY_LIMIT,
      limitResumeAt: resumeAt,
      'stats.limitFailedRecipients': remainingCount,
      'stats.queuedRecipients': remainingCount,
    };

    if (!context.campaign.limitFailedAt) {
      setFields.limitFailedAt = now;
    }

    await this.campaignModel
      .updateOne(
        {
          _id: context.campaign._id,
          status: { $in: [CampaignStatus.RUNNING, CampaignStatus.PAUSED] },
        },
        { $set: setFields },
      )
      .exec();

    return resumeAt;
  }

  /**
   * Atomically flip a RUNNING campaign to COMPLETED once queuedRecipients
   * reaches zero.  The condition on both `status` and `stats.queuedRecipients`
   * ensures only one concurrent worker wins the race.
   */
  private async tryMarkCampaignCompleted(campaignId: Types.ObjectId): Promise<void> {
    const campaign = await this.campaignModel.findById(campaignId).exec();
    if (!campaign) return;

    if (
      campaign.status === CampaignStatus.PAUSED ||
      campaign.status === CampaignStatus.CANCELLED ||
      campaign.status === CampaignStatus.COMPLETED
    ) {
      return;
    }

    const [sent, failed, skipped] = await Promise.all([
      this.campaignRecipientModel.countDocuments({
        campaignId,
        status: CampaignRecipientStatus.SENT,
      }),
      this.campaignRecipientModel.countDocuments({
        campaignId,
        status: CampaignRecipientStatus.FAILED,
      }),
      this.campaignRecipientModel.countDocuments({
        campaignId,
        status: CampaignRecipientStatus.SKIPPED,
      }),
    ]);

    const stats = campaign.stats || {};
    const total = stats.totalRecipients || campaign.contactIds.length || 0;
    const processed = sent + failed + skipped;

    if (processed >= total && total > 0) {
      const now = new Date();
      campaign.status = CampaignStatus.COMPLETED;
      campaign.stats.queuedRecipients = 0;
      campaign.completedAt = now;
      await this.campaignModel
        .updateOne(
          {
            _id: campaignId,
            status: CampaignStatus.RUNNING,
          },
          {
            $set: {
              status: CampaignStatus.COMPLETED,
              'stats.queuedRecipients': 0,
              completedAt: now,
            },
          },
        )
        .exec();
    }
  }

  private async recordSendEvent(input: {
    context: EmailSendContext;
    eventType: EmailSendEventType;
    failureCategory?: EmailFailureCategory;
    failureCode?: string;
    failureMessage?: string;
    smtpResponseCode?: number | null;
    providerMessageId?: string | null;
    attempt: number;
    maxAttempts: number;
    retryScheduled?: boolean;
    hardBounceCandidate?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.sendEventModel.create({
      workspaceId: input.context.workspaceId,
      campaignId: input.context.campaign._id,
      campaignRecipientId: input.context.recipient._id,
      senderAccountId: input.context.senderAccount._id,
      contactId: input.context.contact._id,
      channel: CampaignChannel.EMAIL,
      address: input.context.recipient.address,
      eventType: input.eventType,
      failureCategory: input.failureCategory ?? null,
      failureCode: input.failureCode ?? '',
      failureMessage: input.failureMessage ?? '',
      smtpResponseCode: input.smtpResponseCode ?? null,
      providerMessageId: input.providerMessageId ?? null,
      attempt: input.attempt,
      maxAttempts: input.maxAttempts,
      retryScheduled: input.retryScheduled ?? false,
      hardBounceCandidate: input.hardBounceCandidate ?? false,
      metadata: input.metadata ?? {},
    });
  }

  private toObjectId(id: string, code: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppException(HttpStatus.BAD_REQUEST, code, 'Invalid ObjectId');
    }

    return new Types.ObjectId(id);
  }
}
