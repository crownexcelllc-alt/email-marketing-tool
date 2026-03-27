import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthUser } from '../../common/types/auth-user.type';
import { CampaignChannel } from '../campaigns/constants/campaign.enums';
import { CampaignRecipient } from '../campaigns/schemas/campaign-recipient.schema';
import { Contact } from '../contacts/schemas/contact.schema';
import { SendEvent } from '../email/schemas/send-event.schema';
import { ContactActivity } from '../tracking/schemas/contact-activity.schema';
import { TrackingEvent } from '../tracking/schemas/tracking-event.schema';
import { WhatsappWebhookEvent } from '../webhooks/schemas/whatsapp-webhook-event.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { HistoryEventSource } from './constants/history.enums';
import { ListHistoryDto } from './dto/list-history.dto';
import { HistoryEventResponse, HistoryListResponse } from './types/history.response';

interface NormalizedHistoryFilters {
  campaignId: Types.ObjectId | null;
  contactId: Types.ObjectId | null;
  senderId: Types.ObjectId | null;
  channel: CampaignChannel | null;
  eventTypes: string[];
  sources: Set<HistoryEventSource>;
  dateFrom: Date | null;
  dateTo: Date | null;
}

@Injectable()
export class HistoryService {
  constructor(
    @InjectModel(SendEvent.name)
    private readonly sendEventModel: Model<SendEvent>,
    @InjectModel(TrackingEvent.name)
    private readonly trackingEventModel: Model<TrackingEvent>,
    @InjectModel(ContactActivity.name)
    private readonly contactActivityModel: Model<ContactActivity>,
    @InjectModel(WhatsappWebhookEvent.name)
    private readonly webhookEventModel: Model<WhatsappWebhookEvent>,
    @InjectModel(CampaignRecipient.name)
    private readonly campaignRecipientModel: Model<CampaignRecipient>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<Contact>,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async listHistory(query: ListHistoryDto, authUser: AuthUser): Promise<HistoryListResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const workspaceObjectId = this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID');
    const normalized = this.normalizeFilters(query, undefined, [
      HistoryEventSource.SEND_EVENT,
      HistoryEventSource.TRACKING_EVENT,
      HistoryEventSource.WHATSAPP_WEBHOOK,
    ]);

    return this.queryHistory({
      workspaceId: workspaceObjectId,
      filters: normalized,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  async listContactHistory(
    contactId: string,
    query: ListHistoryDto,
    authUser: AuthUser,
  ): Promise<HistoryListResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const workspaceObjectId = this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID');
    const contactObjectId = this.toObjectId(contactId, 'INVALID_CONTACT_ID');

    const contact = await this.contactModel
      .findOne({
        _id: contactObjectId,
        workspaceId: workspaceObjectId,
      })
      .select('_id')
      .lean()
      .exec();

    if (!contact) {
      throw new AppException(HttpStatus.NOT_FOUND, 'CONTACT_NOT_FOUND', 'Contact not found');
    }

    const normalized = this.normalizeFilters(query, contactId, [
      HistoryEventSource.SEND_EVENT,
      HistoryEventSource.CONTACT_ACTIVITY,
      HistoryEventSource.WHATSAPP_WEBHOOK,
    ]);

    return this.queryHistory({
      workspaceId: workspaceObjectId,
      filters: normalized,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });
  }

  private async queryHistory(input: {
    workspaceId: Types.ObjectId;
    filters: NormalizedHistoryFilters;
    page: number;
    limit: number;
  }): Promise<HistoryListResponse> {
    const basePipeline: Record<string, unknown>[] = [];
    basePipeline.push(...this.buildSendEventSourcePipeline(input.workspaceId, input.filters));

    if (input.filters.sources.has(HistoryEventSource.TRACKING_EVENT)) {
      basePipeline.push({
        $unionWith: {
          coll: this.trackingEventModel.collection.name,
          pipeline: this.buildTrackingSourcePipeline(input.workspaceId, input.filters),
        },
      });
    }

    if (input.filters.sources.has(HistoryEventSource.CONTACT_ACTIVITY)) {
      basePipeline.push({
        $unionWith: {
          coll: this.contactActivityModel.collection.name,
          pipeline: this.buildContactActivitySourcePipeline(input.workspaceId, input.filters),
        },
      });
    }

    if (input.filters.sources.has(HistoryEventSource.WHATSAPP_WEBHOOK)) {
      basePipeline.push({
        $unionWith: {
          coll: this.webhookEventModel.collection.name,
          pipeline: this.buildWebhookSourcePipeline(input.workspaceId, input.filters),
        },
      });
    }

    const finalMatch = this.buildFinalUnifiedMatch(input.filters);
    if (Object.keys(finalMatch).length) {
      basePipeline.push({ $match: finalMatch });
    }

    const [countResult, rawItems] = await Promise.all([
      this.sendEventModel
        .aggregate<{ total: number }>([...basePipeline, { $count: 'total' }] as any[])
        .exec(),
      this.sendEventModel
        .aggregate<
          Record<string, unknown>
        >([...basePipeline, { $sort: { timestamp: -1, _id: -1 } }, { $skip: (input.page - 1) * input.limit }, { $limit: input.limit }] as any[])
        .exec(),
    ]);

    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / input.limit));

    return {
      items: rawItems.map((item) => this.mapHistoryItem(item)),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages,
        hasNext: input.page < totalPages,
        hasPrevious: input.page > 1,
      },
    };
  }

  private buildSendEventSourcePipeline(
    workspaceId: Types.ObjectId,
    filters: NormalizedHistoryFilters,
  ): Record<string, unknown>[] {
    const match: Record<string, unknown> = {
      workspaceId,
    };

    if (filters.campaignId) {
      match.campaignId = filters.campaignId;
    }
    if (filters.contactId) {
      match.contactId = filters.contactId;
    }
    if (filters.senderId) {
      match.senderAccountId = filters.senderId;
    }
    if (filters.channel) {
      match.channel = filters.channel;
    }
    if (filters.dateFrom || filters.dateTo) {
      match.createdAt = this.buildDateRange(filters.dateFrom, filters.dateTo);
    }

    if (!filters.sources.has(HistoryEventSource.SEND_EVENT)) {
      match._id = { $exists: false };
    }

    return [
      { $match: match },
      {
        $project: {
          _id: 1,
          source: { $literal: HistoryEventSource.SEND_EVENT },
          timestamp: '$createdAt',
          campaignId: '$campaignId',
          campaignRecipientId: '$campaignRecipientId',
          contactId: '$contactId',
          senderAccountId: '$senderAccountId',
          channel: '$channel',
          eventType: '$eventType',
          address: '$address',
          providerMessageId: '$providerMessageId',
          failureCode: '$failureCode',
          failureMessage: '$failureMessage',
          metadata: '$metadata',
        },
      },
    ];
  }

  private buildTrackingSourcePipeline(
    workspaceId: Types.ObjectId,
    filters: NormalizedHistoryFilters,
  ): Record<string, unknown>[] {
    if (filters.channel === CampaignChannel.WHATSAPP || filters.senderId) {
      return [{ $match: { _id: { $exists: false } } }];
    }

    const match: Record<string, unknown> = {};
    if (filters.campaignId) {
      match.campaignId = filters.campaignId;
    }
    if (filters.contactId) {
      match.contactId = filters.contactId;
    }
    if (filters.dateFrom || filters.dateTo) {
      match.createdAt = this.buildDateRange(filters.dateFrom, filters.dateTo);
    }

    return [
      { $match: match },
      {
        $lookup: {
          from: this.campaignRecipientModel.collection.name,
          localField: 'campaignRecipientId',
          foreignField: '_id',
          as: 'recipient',
        },
      },
      { $unwind: '$recipient' },
      { $match: { 'recipient.workspaceId': workspaceId } },
      {
        $project: {
          _id: 1,
          source: { $literal: HistoryEventSource.TRACKING_EVENT },
          timestamp: '$createdAt',
          campaignId: '$campaignId',
          campaignRecipientId: '$campaignRecipientId',
          contactId: '$contactId',
          senderAccountId: null,
          channel: { $literal: CampaignChannel.EMAIL },
          eventType: '$eventType',
          address: null,
          providerMessageId: null,
          failureCode: null,
          failureMessage: null,
          metadata: '$metadata',
        },
      },
    ];
  }

  private buildContactActivitySourcePipeline(
    workspaceId: Types.ObjectId,
    filters: NormalizedHistoryFilters,
  ): Record<string, unknown>[] {
    if (filters.channel === CampaignChannel.WHATSAPP || filters.senderId) {
      return [{ $match: { _id: { $exists: false } } }];
    }

    const match: Record<string, unknown> = {};
    if (filters.campaignId) {
      match.campaignId = filters.campaignId;
    }
    if (filters.contactId) {
      match.contactId = filters.contactId;
    }
    if (filters.dateFrom || filters.dateTo) {
      match.occurredAt = this.buildDateRange(filters.dateFrom, filters.dateTo);
    }

    return [
      { $match: match },
      {
        $lookup: {
          from: this.campaignRecipientModel.collection.name,
          localField: 'campaignRecipientId',
          foreignField: '_id',
          as: 'recipient',
        },
      },
      { $unwind: '$recipient' },
      { $match: { 'recipient.workspaceId': workspaceId } },
      {
        $project: {
          _id: 1,
          source: { $literal: HistoryEventSource.CONTACT_ACTIVITY },
          timestamp: '$occurredAt',
          campaignId: '$campaignId',
          campaignRecipientId: '$campaignRecipientId',
          contactId: '$contactId',
          senderAccountId: null,
          channel: { $literal: CampaignChannel.EMAIL },
          eventType: '$eventType',
          address: null,
          providerMessageId: null,
          failureCode: null,
          failureMessage: null,
          metadata: '$metadata',
        },
      },
    ];
  }

  private buildWebhookSourcePipeline(
    workspaceId: Types.ObjectId,
    filters: NormalizedHistoryFilters,
  ): Record<string, unknown>[] {
    if (filters.channel === CampaignChannel.EMAIL) {
      return [{ $match: { _id: { $exists: false } } }];
    }

    const match: Record<string, unknown> = {
      processed: true,
    };

    if (filters.campaignId) {
      match.campaignId = filters.campaignId;
    }
    if (filters.contactId) {
      match.contactId = filters.contactId;
    }
    if (filters.senderId) {
      match.senderAccountId = filters.senderId;
    }
    if (filters.dateFrom || filters.dateTo) {
      match.createdAt = this.buildDateRange(filters.dateFrom, filters.dateTo);
    }

    return [
      { $match: match },
      {
        $lookup: {
          from: this.campaignRecipientModel.collection.name,
          localField: 'campaignRecipientId',
          foreignField: '_id',
          as: 'recipient',
        },
      },
      { $unwind: '$recipient' },
      { $match: { 'recipient.workspaceId': workspaceId } },
      {
        $project: {
          _id: 1,
          source: { $literal: HistoryEventSource.WHATSAPP_WEBHOOK },
          timestamp: { $ifNull: ['$providerTimestamp', '$createdAt'] },
          campaignId: '$campaignId',
          campaignRecipientId: '$campaignRecipientId',
          contactId: '$contactId',
          senderAccountId: '$senderAccountId',
          channel: { $literal: CampaignChannel.WHATSAPP },
          eventType: '$status',
          address: '$recipientPhoneNumber',
          providerMessageId: '$providerMessageId',
          failureCode: null,
          failureMessage: {
            $cond: [{ $eq: ['$status', 'failed'] }, '$processingError', null],
          },
          metadata: '$metadata',
        },
      },
    ];
  }

  private buildFinalUnifiedMatch(filters: NormalizedHistoryFilters): Record<string, unknown> {
    const match: Record<string, unknown> = {};

    if (filters.campaignId) {
      match.campaignId = filters.campaignId;
    }
    if (filters.contactId) {
      match.contactId = filters.contactId;
    }
    if (filters.senderId) {
      match.senderAccountId = filters.senderId;
    }
    if (filters.channel) {
      match.channel = filters.channel;
    }
    if (filters.eventTypes.length) {
      match.eventType = { $in: filters.eventTypes };
    }
    if (filters.sources.size) {
      match.source = { $in: Array.from(filters.sources) };
    }
    if (filters.dateFrom || filters.dateTo) {
      match.timestamp = this.buildDateRange(filters.dateFrom, filters.dateTo);
    }

    return match;
  }

  private normalizeFilters(
    query: ListHistoryDto,
    forcedContactId?: string,
    defaultSources?: HistoryEventSource[],
  ): NormalizedHistoryFilters {
    const sources = query.source?.length
      ? new Set(query.source)
      : new Set(defaultSources ?? [HistoryEventSource.SEND_EVENT]);

    return {
      campaignId: query.campaignId
        ? this.toObjectId(query.campaignId, 'INVALID_CAMPAIGN_ID')
        : null,
      contactId: forcedContactId
        ? this.toObjectId(forcedContactId, 'INVALID_CONTACT_ID')
        : query.contactId
          ? this.toObjectId(query.contactId, 'INVALID_CONTACT_ID')
          : null,
      senderId: query.senderId ? this.toObjectId(query.senderId, 'INVALID_SENDER_ID') : null,
      channel: query.channel ?? null,
      eventTypes: query.eventType?.length ? query.eventType : [],
      sources,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : null,
      dateTo: query.dateTo ? new Date(query.dateTo) : null,
    };
  }

  private mapHistoryItem(item: Record<string, unknown>): HistoryEventResponse {
    return {
      id: this.asString(item._id) ?? '',
      source: (this.asString(item.source) as HistoryEventSource) ?? HistoryEventSource.SEND_EVENT,
      timestamp: this.asDate(item.timestamp) ?? new Date(),
      campaignId: this.asString(item.campaignId),
      campaignRecipientId: this.asString(item.campaignRecipientId),
      contactId: this.asString(item.contactId),
      senderAccountId: this.asString(item.senderAccountId),
      channel: (this.asString(item.channel) as CampaignChannel) ?? null,
      eventType: this.asString(item.eventType) ?? 'unknown',
      address: this.asString(item.address),
      providerMessageId: this.asString(item.providerMessageId),
      failureCode: this.asString(item.failureCode),
      failureMessage: this.asString(item.failureMessage),
      metadata: this.asObject(item.metadata),
    };
  }

  private asObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private asDate(value: unknown): Date | null {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  }

  private asString(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (typeof value === 'object' && value !== null && 'toString' in value) {
      return (value as { toString: () => string }).toString();
    }

    return null;
  }

  private buildDateRange(dateFrom: Date | null, dateTo: Date | null): { $gte?: Date; $lte?: Date } {
    const range: { $gte?: Date; $lte?: Date } = {};
    if (dateFrom) {
      range.$gte = dateFrom;
    }
    if (dateTo) {
      range.$lte = dateTo;
    }
    return range;
  }

  private toObjectId(id: string, code: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppException(HttpStatus.BAD_REQUEST, code, 'Invalid ObjectId');
    }

    return new Types.ObjectId(id);
  }

  private async resolveWorkspaceId(authUser: AuthUser): Promise<string> {
    if (!authUser.workspaceId) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'WORKSPACE_CONTEXT_REQUIRED',
        'workspaceId is required in the authenticated context',
      );
    }

    if (!Types.ObjectId.isValid(authUser.workspaceId)) {
      throw new AppException(HttpStatus.BAD_REQUEST, 'INVALID_WORKSPACE_ID', 'Invalid workspaceId');
    }

    const workspace = await this.workspacesService.findById(authUser.workspaceId);
    if (!workspace) {
      throw new AppException(HttpStatus.NOT_FOUND, 'WORKSPACE_NOT_FOUND', 'Workspace not found');
    }

    return authUser.workspaceId;
  }
}
