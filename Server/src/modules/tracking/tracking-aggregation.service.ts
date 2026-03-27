import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign } from '../campaigns/schemas/campaign.schema';
import { ContactActivity } from './schemas/contact-activity.schema';
import { TrackingEventType } from './constants/tracking.enums';

@Injectable()
export class TrackingAggregationService {
  constructor(
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<Campaign>,
    @InjectModel(ContactActivity.name)
    private readonly contactActivityModel: Model<ContactActivity>,
  ) {}

  async applyEvent(input: {
    campaignId: Types.ObjectId;
    campaignRecipientId: Types.ObjectId;
    contactId: Types.ObjectId;
    eventType: TrackingEventType;
    metadata?: Record<string, unknown>;
    isUniqueForRecipient: boolean;
  }): Promise<void> {
    const now = new Date();
    const inc: Record<string, number> = {};
    const set: Record<string, unknown> = {};

    if (input.eventType === TrackingEventType.OPEN) {
      inc['stats.openCount'] = 1;
      if (input.isUniqueForRecipient) {
        inc['stats.uniqueOpenCount'] = 1;
      }
      set['stats.lastOpenedAt'] = now;
    } else {
      inc['stats.clickCount'] = 1;
      if (input.isUniqueForRecipient) {
        inc['stats.uniqueClickCount'] = 1;
      }
      set['stats.lastClickedAt'] = now;
    }

    await this.campaignModel
      .updateOne(
        { _id: input.campaignId },
        {
          $inc: inc,
          $set: set,
        },
      )
      .exec();

    await this.contactActivityModel.create({
      campaignId: input.campaignId,
      campaignRecipientId: input.campaignRecipientId,
      contactId: input.contactId,
      eventType: input.eventType,
      metadata: input.metadata ?? {},
      occurredAt: now,
    });
  }
}
