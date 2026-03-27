import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  CAMPAIGN_CHANNEL_VALUES,
  CAMPAIGN_RECIPIENT_STATUS_VALUES,
  CampaignChannel,
  CampaignRecipientStatus,
} from '../constants/campaign.enums';

@Schema({ timestamps: true, collection: 'campaign_recipients' })
export class CampaignRecipient {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Campaign', required: true, index: true })
  campaignId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contact', required: true, index: true })
  contactId!: Types.ObjectId;

  @Prop({ type: String, enum: CAMPAIGN_CHANNEL_VALUES, required: true, index: true })
  channel!: CampaignChannel;

  @Prop({ type: String, required: true, trim: true })
  address!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SenderAccount', required: true, index: true })
  senderAccountId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Template', required: true })
  templateId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: CAMPAIGN_RECIPIENT_STATUS_VALUES,
    default: CampaignRecipientStatus.QUEUED,
    index: true,
  })
  status!: CampaignRecipientStatus;

  @Prop({ type: String, default: '' })
  failureReason!: string;

  @Prop({ type: Date, default: null })
  queuedAt!: Date | null;

  @Prop({ type: Date, default: null })
  sentAt!: Date | null;

  @Prop({ type: String, default: null })
  providerMessageId!: string | null;

  @Prop({ type: Date, default: null })
  failedAt!: Date | null;

  @Prop({ type: Date, default: null })
  lastAttemptAt!: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export type CampaignRecipientDocument = HydratedDocument<CampaignRecipient>;
export const CampaignRecipientSchema = SchemaFactory.createForClass(CampaignRecipient);

CampaignRecipientSchema.index({ campaignId: 1, contactId: 1, channel: 1 }, { unique: true });
CampaignRecipientSchema.index({ workspaceId: 1, campaignId: 1, senderAccountId: 1, status: 1 });
CampaignRecipientSchema.index(
  { channel: 1, providerMessageId: 1 },
  {
    partialFilterExpression: {
      providerMessageId: { $type: 'string', $exists: true, $ne: '' },
    },
  },
);
