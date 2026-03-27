import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { CAMPAIGN_CHANNEL_VALUES, CampaignChannel } from '../../campaigns/constants/campaign.enums';
import {
  EMAIL_FAILURE_CATEGORY_VALUES,
  EMAIL_SEND_EVENT_TYPE_VALUES,
  EmailFailureCategory,
  EmailSendEventType,
} from '../constants/email.enums';

@Schema({ timestamps: true, collection: 'send_events' })
export class SendEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Campaign', required: true, index: true })
  campaignId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'CampaignRecipient',
    required: true,
    index: true,
  })
  campaignRecipientId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SenderAccount', required: true, index: true })
  senderAccountId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contact', required: true, index: true })
  contactId!: Types.ObjectId;

  @Prop({ type: String, enum: CAMPAIGN_CHANNEL_VALUES, required: true, index: true })
  channel!: CampaignChannel;

  @Prop({ type: String, required: true, trim: true })
  address!: string;

  @Prop({ type: String, enum: EMAIL_SEND_EVENT_TYPE_VALUES, required: true, index: true })
  eventType!: EmailSendEventType;

  @Prop({ type: String, enum: EMAIL_FAILURE_CATEGORY_VALUES, default: null })
  failureCategory!: EmailFailureCategory | null;

  @Prop({ type: String, default: '' })
  failureCode!: string;

  @Prop({ type: String, default: '' })
  failureMessage!: string;

  @Prop({ type: Number, default: null })
  smtpResponseCode!: number | null;

  @Prop({ type: String, default: null })
  providerMessageId!: string | null;

  @Prop({ type: Number, required: true, min: 1 })
  attempt!: number;

  @Prop({ type: Number, required: true, min: 1 })
  maxAttempts!: number;

  @Prop({ type: Boolean, default: false })
  retryScheduled!: boolean;

  @Prop({ type: Boolean, default: false })
  hardBounceCandidate!: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export type SendEventDocument = HydratedDocument<SendEvent>;
export const SendEventSchema = SchemaFactory.createForClass(SendEvent);

SendEventSchema.index({ campaignRecipientId: 1, attempt: 1, eventType: 1 });
SendEventSchema.index({ workspaceId: 1, campaignId: 1, createdAt: -1 });
