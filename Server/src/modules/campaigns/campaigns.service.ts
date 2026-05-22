import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthUser } from '../../common/types/auth-user.type';
import { Contact, ContactDocument } from '../contacts/schemas/contact.schema';
import { QueueService } from '../queue/queue.service';
import { SegmentType } from '../segments/constants/segment.enums';
import { Segment, SegmentFilters } from '../segments/schemas/segment.schema';
import {
  SenderAccountStatus,
  SenderChannelType,
} from '../sender-accounts/constants/sender-account.enums';
import { SenderAccount } from '../sender-accounts/schemas/sender-account.schema';
import { TemplateChannelType } from '../templates/constants/template.enums';
import { Template } from '../templates/schemas/template.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CampaignDistributionService } from './campaign-distribution.service';
import {
  CampaignChannel,
  CampaignDistributionStrategy,
  CampaignStatus,
  CampaignRecipientStatus,
} from './constants/campaign.enums';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignAudienceDto } from './dto/list-campaign-audience.dto';
import { ListCampaignsDto } from './dto/list-campaigns.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { Campaign, CampaignDocument } from './schemas/campaign.schema';
import { CampaignRecipient } from './schemas/campaign-recipient.schema';
import { CampaignListResponse, CampaignResponse } from './types/campaign.response';
import { ContactListResponse, ContactResponse } from '../contacts/types/contact.response';
import { ContactActivity } from '../tracking/schemas/contact-activity.schema';
import { TrackingEventType } from '../tracking/constants/tracking.enums';
import { ListCampaignRecipientDetailsDto } from './dto/list-campaign-recipient-details.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<Campaign>,
    @InjectModel(CampaignRecipient.name)
    private readonly campaignRecipientModel: Model<CampaignRecipient>,
    @InjectModel(SenderAccount.name)
    private readonly senderAccountModel: Model<SenderAccount>,
    @InjectModel(Template.name)
    private readonly templateModel: Model<Template>,
    @InjectModel(Segment.name)
    private readonly segmentModel: Model<Segment>,
    @InjectModel(Contact.name)
    private readonly contactModel: Model<Contact>,
    @InjectModel(ContactActivity.name)
    private readonly contactActivityModel: Model<ContactActivity>,
    private readonly workspacesService: WorkspacesService,
    private readonly queueService: QueueService,
    private readonly campaignDistributionService: CampaignDistributionService,
  ) {}

  async create(dto: CreateCampaignDto, authUser: AuthUser): Promise<CampaignResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    this.assertDelayRange(dto.randomDelayMinSeconds, dto.randomDelayMaxSeconds);

    const senderAccountIds = this.uniqueObjectIds(dto.senderAccountIds);
    const contactIds = this.uniqueObjectIds(dto.contactIds ?? []);
    const segmentId = dto.segmentId ? this.toObjectId(dto.segmentId, 'INVALID_SEGMENT_ID') : null;
    const templateId = this.toObjectId(dto.templateId, 'INVALID_TEMPLATE_ID');

    await this.validateSenderOwnership(workspaceId, dto.channel, senderAccountIds, false);
    await this.validateTemplateOwnership(workspaceId, dto.channel, templateId);
    await this.validateSegmentOwnership(workspaceId, segmentId);
    await this.validateContactsOwnership(workspaceId, contactIds);

    const created = await this.campaignModel.create({
      workspaceId: this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID'),
      name: dto.name.trim(),
      channel: dto.channel,
      senderAccountIds,
      segmentId,
      contactIds,
      templateId,
      status: dto.status ?? CampaignStatus.DRAFT,
      timezone: dto.timezone ?? 'UTC',
      startAt: dto.startAt ? new Date(dto.startAt) : null,
      sendingWindowStart: dto.sendingWindowStart ?? null,
      sendingWindowEnd: dto.sendingWindowEnd ?? null,
      dailyCap: dto.dailyCap ?? null,
      trackOpens: dto.trackOpens ?? true,
      trackClicks: dto.trackClicks ?? true,
      randomDelayMinSeconds: dto.randomDelayMinSeconds ?? 0,
      randomDelayMaxSeconds: dto.randomDelayMaxSeconds ?? 0,
      settings: {
        distributionStrategy:
          dto.settings?.distributionStrategy ?? CampaignDistributionStrategy.ROUND_ROBIN,
      },
      stats: {
        totalRecipients: 0,
        queuedRecipients: 0,
        skippedRecipients: 0,
        sentRecipients: 0,
        failedRecipients: 0,
        openCount: 0,
        uniqueOpenCount: 0,
        clickCount: 0,
        uniqueClickCount: 0,
        whatsappSentCount: 0,
        whatsappDeliveredCount: 0,
        whatsappReadCount: 0,
        whatsappFailedCount: 0,
        lastStartedAt: null,
        lastOpenedAt: null,
        lastClickedAt: null,
        lastWhatsappStatusAt: null,
      },
    });

    await created.populate('templateId');
    return this.toResponse(created);
  }

  async findAll(query: ListCampaignsDto, authUser: AuthUser): Promise<CampaignListResponse> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: Record<string, unknown> = {
      workspaceId: this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID'),
    };

    if (query.channel) {
      filter.channel = query.channel;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      filter.name = new RegExp(this.escapeRegex(query.search.trim()), 'i');
    }

    const [items, total] = await Promise.all([
      this.campaignModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('templateId')
        .exec(),
      this.campaignModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: items.map((item) => this.toResponse(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: string, authUser: AuthUser): Promise<CampaignResponse> {
    const campaign = await this.findOwnedCampaign(id, authUser);
    return this.toResponse(campaign);
  }

  async findAudience(
    id: string,
    query: ListCampaignAudienceDto,
    authUser: AuthUser,
  ): Promise<ContactListResponse> {
    const campaign = await this.findOwnedCampaign(id, authUser);
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;

    const audienceContactIds = await this.resolveAudienceContactIds(campaign);
    if (!audienceContactIds.length) {
      return {
        items: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      };
    }

    const sendabilityFilter =
      campaign.channel === CampaignChannel.EMAIL
        ? { email: { $nin: [null, ''] } }
        : { phone: { $nin: [null, ''] } };

    const filter = {
      workspaceId: campaign.workspaceId,
      _id: { $in: audienceContactIds },
      ...sendabilityFilter,
    };

    const [items, total] = await Promise.all([
      this.contactModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.contactModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items: items.map((item) => this.toContactResponse(item)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findRecipientDetails(
    campaignId: string,
    query: ListCampaignRecipientDetailsDto,
    authUser: AuthUser,
  ) {
    const campaign = await this.findOwnedCampaign(campaignId, authUser);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const workspaceId = campaign.workspaceId;

    const [openedContactIds, clickedContactIds] = await Promise.all([
      this.contactActivityModel
        .distinct('contactId', {
          campaignId: campaign._id,
          eventType: TrackingEventType.OPEN,
        })
        .exec(),
      this.contactActivityModel
        .distinct('contactId', {
          campaignId: campaign._id,
          eventType: TrackingEventType.CLICK,
        })
        .exec(),
    ]);

    const openedSet = new Set(openedContactIds.map((id) => id.toString()));
    const clickedSet = new Set(clickedContactIds.map((id) => id.toString()));

    const [sentCount, pendingCount, notOpenedCount] = await Promise.all([
      this.campaignRecipientModel
        .countDocuments({
          campaignId: campaign._id,
          status: CampaignRecipientStatus.SENT,
        })
        .exec(),
      this.campaignRecipientModel
        .countDocuments({
          campaignId: campaign._id,
          status: {
            $in: [
              CampaignRecipientStatus.PENDING,
              CampaignRecipientStatus.QUEUED,
              CampaignRecipientStatus.SENDING,
            ],
          },
        })
        .exec(),
      this.campaignRecipientModel
        .countDocuments({
          campaignId: campaign._id,
          status: CampaignRecipientStatus.SENT,
          contactId: { $nin: openedContactIds },
        })
        .exec(),
    ]);

    const summary = {
      sent: sentCount,
      pending: pendingCount,
      opened: openedSet.size,
      clicked: clickedSet.size,
      notOpened: notOpenedCount,
    };

    const filterQuery: Record<string, any> = {
      campaignId: campaign._id,
    };

    const tab = query.filter || 'sent';

    if (tab === 'sent') {
      filterQuery.status = CampaignRecipientStatus.SENT;
    } else if (tab === 'pending') {
      filterQuery.status = {
        $in: [
          CampaignRecipientStatus.PENDING,
          CampaignRecipientStatus.QUEUED,
          CampaignRecipientStatus.SENDING,
        ],
      };
    } else if (tab === 'opened') {
      filterQuery.status = CampaignRecipientStatus.SENT;
      filterQuery.contactId = { $in: openedContactIds };
    } else if (tab === 'clicked') {
      filterQuery.status = CampaignRecipientStatus.SENT;
      filterQuery.contactId = { $in: clickedContactIds };
    } else if (tab === 'notOpened') {
      filterQuery.status = CampaignRecipientStatus.SENT;
      filterQuery.contactId = { $nin: openedContactIds };
    }

    if (query.search?.trim()) {
      const searchReg = new RegExp(this.escapeRegex(query.search.trim()), 'i');
      const contacts = await this.contactModel
        .find({
          workspaceId,
          $or: [
            { firstName: searchReg },
            { lastName: searchReg },
            { email: searchReg },
            { phone: searchReg },
          ],
        })
        .select('_id')
        .lean()
        .exec();

      const matchedContactIds = contacts.map((c) => c._id);

      if (filterQuery.contactId) {
        if (filterQuery.contactId.$in) {
          const existingIn = new Set(filterQuery.contactId.$in.map((id: any) => id.toString()));
          const intersected = matchedContactIds.filter((id) => existingIn.has(id.toString()));
          filterQuery.contactId = { $in: intersected };
        } else if (filterQuery.contactId.$nin) {
          const existingNin = new Set(filterQuery.contactId.$nin.map((id: any) => id.toString()));
          const filtered = matchedContactIds.filter((id) => !existingNin.has(id.toString()));
          filterQuery.contactId = { $in: filtered };
        }
      } else {
        filterQuery.contactId = { $in: matchedContactIds };
      }
    }

    const [recipients, total] = await Promise.all([
      this.campaignRecipientModel
        .find(filterQuery)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('contactId')
        .exec(),
      this.campaignRecipientModel.countDocuments(filterQuery).exec(),
    ]);

    // Resolve contacts that were not populated (null contactId)
    const nullContactRecipients = recipients.filter((r) => !r.contactId);
    const resolvedContactsMap = new Map<string, any>();
    if (nullContactRecipients.length > 0) {
      const addresses = nullContactRecipients.map((r) => r.address).filter(Boolean);
      if (addresses.length > 0) {
        const contacts = await this.contactModel
          .find({
            workspaceId,
            $or: [
              { email: { $in: addresses } },
              { emailNormalized: { $in: addresses } },
              { phone: { $in: addresses } },
              { phoneNormalized: { $in: addresses } },
            ],
          })
          .lean()
          .exec();
        for (const contactObj of contacts) {
          if (contactObj.email) {
            resolvedContactsMap.set(contactObj.email.toLowerCase(), contactObj);
          }
          if (contactObj.emailNormalized) {
            resolvedContactsMap.set(contactObj.emailNormalized.toLowerCase(), contactObj);
          }
          if (contactObj.phone) {
            resolvedContactsMap.set(contactObj.phone, contactObj);
          }
          if (contactObj.phoneNormalized) {
            resolvedContactsMap.set(contactObj.phoneNormalized, contactObj);
          }
        }
      }
    }

    // Prepare contact IDs to fetch activities
    const contactIdsOnPage: Types.ObjectId[] = [];
    const resolvedItems = recipients.map((recipient) => {
      let contactObj = recipient.contactId as any;
      if (!contactObj && recipient.address) {
        contactObj = resolvedContactsMap.get(recipient.address.toLowerCase());
      }
      if (contactObj && contactObj._id) {
        contactIdsOnPage.push(contactObj._id);
      }
      return {
        recipient,
        contactObj,
      };
    });

    const activities = await this.contactActivityModel
      .find({
        campaignId: campaign._id,
        contactId: { $in: contactIdsOnPage },
      })
      .lean()
      .exec();

    const activityMap = new Map<string, Record<string, Date>>();
    for (const act of activities) {
      const cId = act.contactId.toString();
      if (!activityMap.has(cId)) {
        activityMap.set(cId, {});
      }
      activityMap.get(cId)![act.eventType] = act.occurredAt;
    }

    const items = resolvedItems.map(({ recipient, contactObj }) => {
      const cId = contactObj?._id?.toString() || '';
      const act = activityMap.get(cId) || {};

      let name = '';
      if (contactObj) {
        name =
          (contactObj.fullName || '').trim() ||
          `${contactObj.firstName || ''} ${contactObj.lastName || ''}`.trim();
      }

      return {
        id: recipient._id.toString(),
        contactId: cId,
        name: name,
        email: contactObj?.email || recipient.address,
        status: recipient.status,
        sentAt: recipient.sentAt,
        openedAt: act.open || null,
        clickedAt: act.click || null,
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      summary,
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async update(id: string, dto: UpdateCampaignDto, authUser: AuthUser): Promise<CampaignResponse> {
    const campaign = await this.findOwnedCampaign(id, authUser);

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_LOCKED',
        'Only campaigns in DRAFT status can be directly edited. Please duplicate the campaign instead.',
      );
    }

    const workspaceId = campaign.workspaceId.toString();
    let hasEdits = false;

    if (dto.name !== undefined) {
      const nextName = dto.name.trim();
      hasEdits ||= campaign.name !== nextName;
      campaign.name = nextName;
    }

    if (dto.channel !== undefined) {
      hasEdits ||= campaign.channel !== dto.channel;
      campaign.channel = dto.channel;
    }

    if (dto.senderAccountIds !== undefined) {
      const nextSenderAccountIds = this.uniqueObjectIds(dto.senderAccountIds);
      hasEdits ||= !this.objectIdArraysEqual(campaign.senderAccountIds, nextSenderAccountIds);
      campaign.senderAccountIds = nextSenderAccountIds;
    }

    if (dto.segmentId !== undefined) {
      const nextSegmentId = dto.segmentId
        ? this.toObjectId(dto.segmentId, 'INVALID_SEGMENT_ID')
        : null;
      hasEdits ||= !this.objectIdsEqual(campaign.segmentId, nextSegmentId);
      campaign.segmentId = nextSegmentId;
    }

    if (dto.contactIds !== undefined) {
      const nextContactIds = this.uniqueObjectIds(dto.contactIds);
      hasEdits ||= !this.objectIdArraysEqual(campaign.contactIds, nextContactIds);
      campaign.contactIds = nextContactIds;
    }

    if (dto.templateId !== undefined) {
      const nextTemplateId = this.toObjectId(dto.templateId, 'INVALID_TEMPLATE_ID');
      hasEdits ||= !this.objectIdsEqual(campaign.templateId, nextTemplateId);
      campaign.templateId = nextTemplateId;
    }

    if (dto.timezone !== undefined) {
      hasEdits ||= campaign.timezone !== dto.timezone;
      campaign.timezone = dto.timezone;
    }

    if (dto.startAt !== undefined) {
      const nextStartAt = dto.startAt ? new Date(dto.startAt) : null;
      hasEdits ||= !this.datesEqual(campaign.startAt, nextStartAt);
      campaign.startAt = nextStartAt;
    }

    if (dto.sendingWindowStart !== undefined) {
      const nextSendingWindowStart = dto.sendingWindowStart ?? null;
      hasEdits ||= campaign.sendingWindowStart !== nextSendingWindowStart;
      campaign.sendingWindowStart = nextSendingWindowStart;
    }

    if (dto.sendingWindowEnd !== undefined) {
      const nextSendingWindowEnd = dto.sendingWindowEnd ?? null;
      hasEdits ||= campaign.sendingWindowEnd !== nextSendingWindowEnd;
      campaign.sendingWindowEnd = nextSendingWindowEnd;
    }

    if (dto.dailyCap !== undefined) {
      const nextDailyCap = dto.dailyCap ?? null;
      hasEdits ||= campaign.dailyCap !== nextDailyCap;
      campaign.dailyCap = nextDailyCap;
    }

    if (dto.trackOpens !== undefined) {
      hasEdits ||= campaign.trackOpens !== dto.trackOpens;
      campaign.trackOpens = dto.trackOpens;
    }

    if (dto.trackClicks !== undefined) {
      hasEdits ||= campaign.trackClicks !== dto.trackClicks;
      campaign.trackClicks = dto.trackClicks;
    }

    if (dto.randomDelayMinSeconds !== undefined) {
      hasEdits ||= campaign.randomDelayMinSeconds !== dto.randomDelayMinSeconds;
      campaign.randomDelayMinSeconds = dto.randomDelayMinSeconds;
    }

    if (dto.randomDelayMaxSeconds !== undefined) {
      hasEdits ||= campaign.randomDelayMaxSeconds !== dto.randomDelayMaxSeconds;
      campaign.randomDelayMaxSeconds = dto.randomDelayMaxSeconds;
    }

    if (dto.settings?.distributionStrategy !== undefined) {
      hasEdits ||= campaign.settings.distributionStrategy !== dto.settings.distributionStrategy;
      campaign.settings.distributionStrategy = dto.settings.distributionStrategy;
    }

    if (!hasEdits) {
      return this.toResponse(campaign);
    }

    this.assertDelayRange(campaign.randomDelayMinSeconds, campaign.randomDelayMaxSeconds);

    await this.validateSenderOwnership(
      workspaceId,
      campaign.channel,
      campaign.senderAccountIds,
      false,
    );
    await this.validateTemplateOwnership(
      workspaceId,
      campaign.channel,
      campaign.populated('templateId') || campaign.templateId?._id || campaign.templateId,
    );
    await this.validateSegmentOwnership(workspaceId, campaign.segmentId);
    await this.validateContactsOwnership(workspaceId, campaign.contactIds);

    campaign.editedAt = new Date();

    const saved = await this.campaignModel
      .findOneAndUpdate(
        { _id: campaign._id },
        {
          $set: {
            name: campaign.name,
            senderAccountIds: campaign.senderAccountIds,
            segmentId: campaign.segmentId,
            contactIds: campaign.contactIds,
            templateId:
              campaign.populated('templateId') || campaign.templateId?._id || campaign.templateId,
            timezone: campaign.timezone,
            startAt: campaign.startAt,
            sendingWindowStart: campaign.sendingWindowStart,
            sendingWindowEnd: campaign.sendingWindowEnd,
            dailyCap: campaign.dailyCap,
            trackOpens: campaign.trackOpens,
            trackClicks: campaign.trackClicks,
            randomDelayMinSeconds: campaign.randomDelayMinSeconds,
            randomDelayMaxSeconds: campaign.randomDelayMaxSeconds,
            'settings.distributionStrategy': campaign.settings?.distributionStrategy,
            editedAt: campaign.editedAt,
          },
        },
        { returnDocument: 'after' },
      )
      .populate('templateId')
      .exec();
    return this.toResponse(saved || campaign);
  }

  async remove(id: string, authUser: AuthUser): Promise<{ deleted: true; id: string }> {
    const campaign = await this.findOwnedCampaign(id, authUser);
    await this.campaignModel.deleteOne({ _id: campaign._id }).exec();

    return {
      deleted: true,
      id,
    };
  }

  async duplicate(id: string, authUser: AuthUser): Promise<CampaignResponse> {
    const original = await this.findOwnedCampaign(id, authUser);
    const workspaceId = original.workspaceId;

    const cleanName = original.name.replace(/ - Copy( \d+)?$/, '').trim();
    const escapedCleanName = cleanName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const nameRegex = new RegExp(`^${escapedCleanName}( - Copy \\d+)?$`);

    const highestCopy = await this.campaignModel
      .findOne({
        workspaceId,
        name: nameRegex,
      })
      .sort({ copyNumber: -1 })
      .select('copyNumber')
      .lean()
      .exec();

    const copyNumber = ((highestCopy?.copyNumber as number) ?? 0) + 1;
    const nameSuffix = ` - Copy ${copyNumber}`;

    const duplicated = await this.campaignModel.create({
      workspaceId: original.workspaceId,
      name: `${cleanName}${nameSuffix}`,
      channel: original.channel,
      senderAccountIds: original.senderAccountIds,
      segmentId: original.segmentId,
      contactIds: original.contactIds,
      templateId:
        original.populated('templateId') || original.templateId?._id || original.templateId,
      status: CampaignStatus.DRAFT,
      timezone: original.timezone ?? 'UTC',
      startAt: null,
      sendingWindowStart: original.sendingWindowStart ?? null,
      sendingWindowEnd: original.sendingWindowEnd ?? null,
      dailyCap: original.dailyCap ?? null,
      trackOpens: original.trackOpens ?? true,
      trackClicks: original.trackClicks ?? true,
      randomDelayMinSeconds: original.randomDelayMinSeconds ?? 0,
      randomDelayMaxSeconds: original.randomDelayMaxSeconds ?? 0,
      settings: {
        distributionStrategy:
          original.settings?.distributionStrategy ?? CampaignDistributionStrategy.ROUND_ROBIN,
      },
      stats: {
        totalRecipients: 0,
        queuedRecipients: 0,
        skippedRecipients: 0,
        sentRecipients: 0,
        failedRecipients: 0,
        openCount: 0,
        uniqueOpenCount: 0,
        clickCount: 0,
        uniqueClickCount: 0,
        whatsappSentCount: 0,
        whatsappDeliveredCount: 0,
        whatsappReadCount: 0,
        whatsappFailedCount: 0,
        lastStartedAt: null,
        lastOpenedAt: null,
        lastClickedAt: null,
        lastWhatsappStatusAt: null,
      },
      trackingBaseUrl: null,
      editedAt: null,
      copyNumber,
    });

    await duplicated.populate('templateId');
    return this.toResponse(duplicated);
  }

  async start(id: string, authUser: AuthUser, trackingBaseUrl: string): Promise<CampaignResponse> {
    const campaign = await this.findOwnedCampaign(id, authUser);
    const workspaceId = campaign.workspaceId.toString();

    await this.validateTemplateOwnership(
      workspaceId,
      campaign.channel,
      campaign.populated('templateId') || campaign.templateId?._id || campaign.templateId,
    );
    await this.validateSegmentOwnership(workspaceId, campaign.segmentId);
    await this.validateContactsOwnership(workspaceId, campaign.contactIds);

    const recipients = await this.resolveAudienceRecipients(campaign);
    const eligibleSenders = await this.validateSenderOwnership(
      workspaceId,
      campaign.channel,
      campaign.senderAccountIds,
      true,
    );

    const senderCaps = eligibleSenders.map((sender) => ({
      senderAccountId: sender._id.toString(),
      dailyLimit: this.resolveSenderDailyLimit(sender, campaign.dailyCap),
      hourlyLimit: this.resolveSenderHourlyLimit(sender, campaign.dailyCap),
    }));

    this.campaignDistributionService.validateCampaignCanStart(
      campaign.status,
      recipients.length,
      senderCaps,
    );

    campaign.status = campaign.startAt ? CampaignStatus.SCHEDULED : CampaignStatus.RUNNING;
    campaign.stats.totalRecipients = recipients.length;
    campaign.stats.queuedRecipients = 0;
    campaign.stats.skippedRecipients = 0;
    campaign.stats.lastStartedAt = new Date();
    campaign.trackingBaseUrl = trackingBaseUrl;

    await this.campaignModel
      .updateOne(
        { _id: campaign._id },
        {
          $set: {
            status: campaign.status,
            'stats.totalRecipients': campaign.stats.totalRecipients,
            'stats.queuedRecipients': campaign.stats.queuedRecipients,
            'stats.skippedRecipients': campaign.stats.skippedRecipients,
            'stats.lastStartedAt': campaign.stats.lastStartedAt,
            trackingBaseUrl: campaign.trackingBaseUrl,
          },
        },
      )
      .exec();

    const delayMs = campaign.startAt
      ? Math.max(0, campaign.startAt.getTime() - Date.now())
      : undefined;

    await this.queueService.enqueueCampaignScheduler(
      {
        campaignId: campaign.id,
        workspaceId,
      },
      delayMs ? { delay: delayMs } : undefined,
    );

    return this.toResponse(campaign);
  }

  async pause(id: string, authUser: AuthUser): Promise<CampaignResponse> {
    const campaign = await this.findOwnedCampaign(id, authUser);
    if (
      campaign.status !== CampaignStatus.RUNNING &&
      campaign.status !== CampaignStatus.SCHEDULED
    ) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_PAUSE_NOT_ALLOWED',
        'Only running or scheduled campaigns can be paused',
      );
    }

    const result = await this.campaignModel
      .updateOne(
        { _id: campaign._id, status: { $ne: CampaignStatus.COMPLETED } },
        { $set: { status: CampaignStatus.PAUSED } },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_PAUSE_NOT_ALLOWED',
        'Campaign is already completed',
      );
    }

    campaign.status = CampaignStatus.PAUSED;
    return this.toResponse(campaign);
  }

  async resume(id: string, authUser: AuthUser, trackingBaseUrl: string): Promise<CampaignResponse> {
    const campaign = await this.findOwnedCampaign(id, authUser);
    if (campaign.status !== CampaignStatus.PAUSED && campaign.status !== CampaignStatus.CANCELLED) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_RESUME_NOT_ALLOWED',
        'Only paused or cancelled campaigns can be resumed or restarted',
      );
    }

    const wasCancelled = campaign.status === CampaignStatus.CANCELLED;
    if (wasCancelled) {
      // Clear past recipient send lists so scheduler can rebuild audience assignments
      await this.campaignRecipientModel.deleteMany({ campaignId: campaign._id }).exec();

      // Reset statistics for a fresh restart
      campaign.stats = {
        totalRecipients: 0,
        queuedRecipients: 0,
        skippedRecipients: 0,
        sentRecipients: 0,
        failedRecipients: 0,
        openCount: 0,
        uniqueOpenCount: 0,
        clickCount: 0,
        uniqueClickCount: 0,
        whatsappSentCount: 0,
        whatsappDeliveredCount: 0,
        whatsappReadCount: 0,
        whatsappFailedCount: 0,
        lastStartedAt: new Date(),
        lastOpenedAt: null,
        lastClickedAt: null,
        lastWhatsappStatusAt: null,
      };
    } else {
      await this.campaignRecipientModel
        .updateMany(
          {
            campaignId: campaign._id,
            status: { $in: [CampaignRecipientStatus.QUEUED, CampaignRecipientStatus.SENDING] },
          },
          {
            $set: { status: CampaignRecipientStatus.PENDING },
          },
        )
        .exec();
    }

    campaign.status = CampaignStatus.RUNNING;
    campaign.trackingBaseUrl = trackingBaseUrl;

    const updateFields: Record<string, any> = {
      status: CampaignStatus.RUNNING,
      trackingBaseUrl: trackingBaseUrl,
    };
    if (wasCancelled) {
      updateFields.stats = campaign.stats;
    }

    await this.campaignModel.updateOne({ _id: campaign._id }, { $set: updateFields }).exec();

    await this.queueService.enqueueCampaignScheduler({
      campaignId: campaign.id,
      workspaceId: campaign.workspaceId.toString(),
    });

    return this.toResponse(campaign);
  }

  async cancel(id: string, authUser: AuthUser): Promise<CampaignResponse> {
    const campaign = await this.findOwnedCampaign(id, authUser);

    if (
      campaign.status === CampaignStatus.COMPLETED ||
      campaign.status === CampaignStatus.CANCELLED
    ) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_CANCEL_NOT_ALLOWED',
        'Campaign is already completed or cancelled',
      );
    }

    const result = await this.campaignModel
      .updateOne(
        { _id: campaign._id, status: { $ne: CampaignStatus.COMPLETED } },
        { $set: { status: CampaignStatus.CANCELLED } },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CAMPAIGN_CANCEL_NOT_ALLOWED',
        'Campaign is already completed',
      );
    }

    campaign.status = CampaignStatus.CANCELLED;
    return this.toResponse(campaign);
  }

  private async resolveAudienceRecipients(
    campaign: CampaignDocument,
  ): Promise<Array<{ contactId: string; address: string }>> {
    const audienceContactIds = await this.resolveAudienceContactIds(campaign);
    if (!audienceContactIds.length) {
      return [];
    }
    const contacts = await this.contactModel
      .find({
        workspaceId: campaign.workspaceId,
        _id: { $in: audienceContactIds },
      })
      .select('_id email phone')
      .lean()
      .exec();

    const recipients: Array<{ contactId: string; address: string }> = [];

    for (const contact of contacts) {
      const address =
        campaign.channel === CampaignChannel.EMAIL
          ? (contact.email ?? '').trim().toLowerCase()
          : this.normalizePhone(contact.phone ?? '');

      if (!address) {
        continue;
      }

      recipients.push({
        contactId: String(contact._id),
        address,
      });
    }

    return recipients;
  }

  private async resolveAudienceContactIds(campaign: CampaignDocument): Promise<Types.ObjectId[]> {
    const contactIdSet = new Set<string>(campaign.contactIds.map((id) => id.toString()));

    if (campaign.segmentId) {
      const segment = await this.segmentModel
        .findOne({
          _id: campaign.segmentId,
          workspaceId: campaign.workspaceId,
        })
        .lean()
        .exec();

      if (!segment) {
        throw new AppException(HttpStatus.NOT_FOUND, 'SEGMENT_NOT_FOUND', 'Segment not found');
      }

      if (segment.type === SegmentType.STATIC) {
        for (const segmentContactId of segment.contactIds ?? []) {
          contactIdSet.add(String(segmentContactId));
        }
      } else {
        const dynamicContactIds = await this.findDynamicSegmentContactIds(
          campaign.workspaceId,
          segment.filters as SegmentFilters,
        );
        for (const dynamicId of dynamicContactIds) {
          contactIdSet.add(dynamicId);
        }
      }
    }

    return Array.from(contactIdSet).map((id) => this.toObjectId(id, 'INVALID_CONTACT_ID'));
  }

  private async findDynamicSegmentContactIds(
    workspaceId: Types.ObjectId,
    filters: SegmentFilters | undefined,
  ): Promise<string[]> {
    const query: Record<string, unknown> = { workspaceId };

    const normalizedTags = (filters?.tags ?? [])
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
    if (normalizedTags.length) {
      query.tags = { $all: normalizedTags };
    }

    if (filters?.subscriptionStatus) {
      query.subscriptionStatus = filters.subscriptionStatus;
    }
    if (filters?.emailStatus) {
      query.emailStatus = filters.emailStatus;
    }
    if (filters?.whatsappStatus) {
      query.whatsappStatus = filters.whatsappStatus;
    }

    const contacts = await this.contactModel.find(query).select('_id').lean().exec();
    return contacts.map((contact) => String(contact._id));
  }

  private async findOwnedCampaign(id: string, authUser: AuthUser): Promise<CampaignDocument> {
    const workspaceId = await this.resolveWorkspaceId(authUser);
    const campaign = await this.campaignModel
      .findOne({
        _id: this.toObjectId(id, 'INVALID_CAMPAIGN_ID'),
        workspaceId: this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID'),
      })
      .populate('templateId')
      .exec();

    if (!campaign) {
      throw new AppException(HttpStatus.NOT_FOUND, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
    }

    return campaign;
  }

  private async validateSenderOwnership(
    workspaceId: string,
    channel: CampaignChannel,
    senderIds: Types.ObjectId[],
    activeOnly: boolean,
  ): Promise<
    Array<{
      _id: Types.ObjectId;
      status: SenderAccountStatus;
      email?: { dailyLimit: number; hourlyLimit: number } | null;
    }>
  > {
    if (!senderIds.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'SENDER_ACCOUNTS_REQUIRED',
        'At least one sender account is required',
      );
    }

    const channelType =
      channel === CampaignChannel.EMAIL ? SenderChannelType.EMAIL : SenderChannelType.WHATSAPP;

    const senders = await this.senderAccountModel
      .find({
        workspaceId: this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID'),
        _id: { $in: senderIds },
        channelType,
      })
      .select('_id status email')
      .lean()
      .exec();

    const found = new Set(senders.map((sender) => String(sender._id)));
    const missing = senderIds.map((id) => String(id)).filter((id) => !found.has(id));

    if (missing.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'SENDER_ACCOUNTS_NOT_IN_WORKSPACE_OR_CHANNEL',
        'Some senderAccountIds are invalid for workspace/channel',
        { missing },
      );
    }

    const eligible = senders.filter((sender) => {
      if (!activeOnly) {
        return true;
      }

      return sender.status === SenderAccountStatus.ACTIVE;
    });

    if (activeOnly && !eligible.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'NO_ACTIVE_SENDERS',
        'No active sender accounts available for this campaign',
      );
    }

    return eligible.map((sender) => ({
      _id: sender._id as Types.ObjectId,
      status: sender.status as SenderAccountStatus,
      email: sender.email as { dailyLimit: number; hourlyLimit: number } | null,
    }));
  }

  private async validateTemplateOwnership(
    workspaceId: string,
    channel: CampaignChannel,
    templateId: Types.ObjectId,
  ): Promise<void> {
    const channelType =
      channel === CampaignChannel.EMAIL ? TemplateChannelType.EMAIL : TemplateChannelType.WHATSAPP;
    const template = await this.templateModel
      .findOne({
        _id: templateId,
        workspaceId: this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID'),
        channelType,
      })
      .select('_id')
      .lean()
      .exec();

    if (!template) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'TEMPLATE_NOT_IN_WORKSPACE_OR_CHANNEL',
        'Template does not belong to workspace or campaign channel',
      );
    }
  }

  private async validateSegmentOwnership(
    workspaceId: string,
    segmentId: Types.ObjectId | null,
  ): Promise<void> {
    if (!segmentId) {
      return;
    }

    const segment = await this.segmentModel
      .findOne({
        _id: segmentId,
        workspaceId: this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID'),
      })
      .select('_id')
      .lean()
      .exec();

    if (!segment) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'SEGMENT_NOT_IN_WORKSPACE',
        'Segment does not belong to workspace',
      );
    }
  }

  private async validateContactsOwnership(
    workspaceId: string,
    contactIds: Types.ObjectId[],
  ): Promise<void> {
    if (!contactIds.length) {
      return;
    }

    const contacts = await this.contactModel
      .find({
        workspaceId: this.toObjectId(workspaceId, 'INVALID_WORKSPACE_ID'),
        _id: { $in: contactIds },
      })
      .select('_id')
      .lean()
      .exec();

    const found = new Set(contacts.map((contact) => String(contact._id)));
    const missing = contactIds.map((id) => String(id)).filter((id) => !found.has(id));

    if (missing.length) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'CONTACTS_NOT_IN_WORKSPACE',
        'Some contactIds do not belong to workspace',
        { missing },
      );
    }
  }

  private resolveSenderDailyLimit(
    sender: { email?: { dailyLimit: number } | null },
    campaignDailyCap: number | null,
  ): number {
    const base = sender.email?.dailyLimit ?? Number.MAX_SAFE_INTEGER;
    if (!campaignDailyCap) {
      return base;
    }

    return Math.min(base, campaignDailyCap);
  }

  private resolveSenderHourlyLimit(
    sender: { email?: { hourlyLimit: number } | null },
    campaignDailyCap: number | null,
  ): number {
    const base = sender.email?.hourlyLimit ?? Number.MAX_SAFE_INTEGER;
    if (!campaignDailyCap) {
      return base;
    }

    return Math.min(base, campaignDailyCap);
  }

  private toResponse(campaign: CampaignDocument): CampaignResponse {
    const templateObj = campaign.templateId as any;
    const isPopulated = templateObj && typeof templateObj === 'object' && 'name' in templateObj;
    const rawTemplateId = campaign.populated('templateId') || campaign.templateId;
    const templateIdStr = rawTemplateId ? rawTemplateId.toString() : '';
    const templateName = isPopulated ? templateObj.name : null;
    const templateSubject = isPopulated
      ? templateObj.email?.subject || templateObj.whatsapp?.templateName || null
      : null;

    return {
      id: campaign.id,
      workspaceId: campaign.workspaceId.toString(),
      name: campaign.name,
      channel: campaign.channel,
      senderAccountIds: campaign.senderAccountIds.map((id) => id.toString()),
      segmentId: campaign.segmentId ? campaign.segmentId.toString() : null,
      contactIds: campaign.contactIds.map((id) => id.toString()),
      templateId: templateIdStr,
      templateName,
      templateSubject,
      status: campaign.status,
      timezone: campaign.timezone,
      startAt: campaign.startAt,
      sendingWindowStart: campaign.sendingWindowStart,
      sendingWindowEnd: campaign.sendingWindowEnd,
      dailyCap: campaign.dailyCap,
      trackOpens: campaign.trackOpens,
      trackClicks: campaign.trackClicks,
      randomDelayMinSeconds: campaign.randomDelayMinSeconds,
      randomDelayMaxSeconds: campaign.randomDelayMaxSeconds,
      settings: {
        distributionStrategy:
          campaign.settings?.distributionStrategy ?? CampaignDistributionStrategy.ROUND_ROBIN,
      },
      trackingBaseUrl: campaign.trackingBaseUrl ?? null,
      stats: {
        totalRecipients: campaign.stats?.totalRecipients || campaign.contactIds.length || 0,
        queuedRecipients: campaign.stats?.queuedRecipients ?? 0,
        skippedRecipients: campaign.stats?.skippedRecipients ?? 0,
        sentRecipients: campaign.stats?.sentRecipients ?? 0,
        failedRecipients: campaign.stats?.failedRecipients ?? 0,
        openCount: campaign.stats?.openCount ?? 0,
        uniqueOpenCount: campaign.stats?.uniqueOpenCount ?? 0,
        clickCount: campaign.stats?.clickCount ?? 0,
        uniqueClickCount: campaign.stats?.uniqueClickCount ?? 0,
        whatsappSentCount: campaign.stats?.whatsappSentCount ?? 0,
        whatsappDeliveredCount: campaign.stats?.whatsappDeliveredCount ?? 0,
        whatsappReadCount: campaign.stats?.whatsappReadCount ?? 0,
        whatsappFailedCount: campaign.stats?.whatsappFailedCount ?? 0,
        lastStartedAt: campaign.stats?.lastStartedAt ?? null,
        lastOpenedAt: campaign.stats?.lastOpenedAt ?? null,
        lastClickedAt: campaign.stats?.lastClickedAt ?? null,
        lastWhatsappStatusAt: campaign.stats?.lastWhatsappStatusAt ?? null,
      },
      editedAt: campaign.editedAt ?? null,
      copyNumber: campaign.copyNumber ?? 0,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }

  private toContactResponse(contact: ContactDocument): ContactResponse {
    const labels = contact.labels?.length ? [...contact.labels] : [...contact.tags];
    const category = contact.category || labels[0] || '';

    return {
      id: contact.id,
      workspaceId: contact.workspaceId.toString(),
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      category,
      labels,
      customFields: { ...(contact.customFields ?? {}) },
      emailStatus: contact.emailStatus,
      whatsappStatus: contact.whatsappStatus,
      subscriptionStatus: contact.subscriptionStatus,
      source: contact.source,
      notes: contact.notes,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }

  private assertDelayRange(minDelaySeconds?: number, maxDelaySeconds?: number): void {
    if (
      minDelaySeconds !== undefined &&
      maxDelaySeconds !== undefined &&
      maxDelaySeconds < minDelaySeconds
    ) {
      throw new AppException(
        HttpStatus.BAD_REQUEST,
        'INVALID_DELAY_RANGE',
        'randomDelayMaxSeconds must be greater than or equal to randomDelayMinSeconds',
      );
    }
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

  private uniqueObjectIds(ids: string[]): Types.ObjectId[] {
    return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean))).map((id) =>
      this.toObjectId(id, 'INVALID_ID'),
    );
  }

  private objectIdsEqual(left: any, right: any): boolean {
    const leftId = left?._id ? left._id.toString() : (left?.toString() ?? null);
    const rightId = right?._id ? right._id.toString() : (right?.toString() ?? null);
    return leftId === rightId;
  }

  private objectIdArraysEqual(left: Types.ObjectId[], right: Types.ObjectId[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    const leftIds = left.map((id) => id.toString()).sort();
    const rightIds = right.map((id) => id.toString()).sort();

    return leftIds.every((id, index) => id === rightIds[index]);
  }

  private datesEqual(left: Date | null | undefined, right: Date | null | undefined): boolean {
    return (left?.getTime() ?? null) === (right?.getTime() ?? null);
  }

  private toObjectId(id: string, code: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppException(HttpStatus.BAD_REQUEST, code, 'Invalid ObjectId');
    }

    return new Types.ObjectId(id);
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizePhone(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    let normalized = trimmed.replace(/[^\d+]/g, '');
    if (normalized.startsWith('+')) {
      normalized = `+${normalized.slice(1).replace(/\+/g, '')}`;
    } else {
      normalized = normalized.replace(/\+/g, '');
    }

    return normalized;
  }
}
