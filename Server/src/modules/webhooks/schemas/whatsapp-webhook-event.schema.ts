import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  WHATSAPP_WEBHOOK_MESSAGE_STATUS_VALUES,
  WhatsappWebhookMessageStatus,
} from '../constants/whatsapp-webhook.enums';

@Schema({ timestamps: true, collection: 'whatsapp_webhook_events' })
export class WhatsappWebhookEvent {
  @Prop({ type: String, required: true, unique: true, index: true })
  eventKey!: string;

  @Prop({ type: String, required: true, index: true, trim: true })
  providerMessageId!: string;

  @Prop({
    type: String,
    enum: WHATSAPP_WEBHOOK_MESSAGE_STATUS_VALUES,
    required: true,
    index: true,
  })
  status!: WhatsappWebhookMessageStatus;

  @Prop({ type: Date, default: null, index: true })
  providerTimestamp!: Date | null;

  @Prop({ type: String, default: null, index: true })
  phoneNumberId!: string | null;

  @Prop({ type: String, default: null })
  recipientPhoneNumber!: string | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Campaign', default: null, index: true })
  campaignId!: Types.ObjectId | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'CampaignRecipient',
    default: null,
    index: true,
  })
  campaignRecipientId!: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contact', default: null, index: true })
  contactId!: Types.ObjectId | null;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SenderAccount', default: null, index: true })
  senderAccountId!: Types.ObjectId | null;

  @Prop({ type: Boolean, default: false, index: true })
  processed!: boolean;

  @Prop({ type: String, default: '' })
  processingError!: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  rawPayload!: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export type WhatsappWebhookEventDocument = HydratedDocument<WhatsappWebhookEvent>;
export const WhatsappWebhookEventSchema = SchemaFactory.createForClass(WhatsappWebhookEvent);

WhatsappWebhookEventSchema.index({ providerMessageId: 1, status: 1, createdAt: -1 });
WhatsappWebhookEventSchema.index({ campaignId: 1, createdAt: -1 });
