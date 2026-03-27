import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { TRACKING_EVENT_TYPE_VALUES, TrackingEventType } from '../constants/tracking.enums';

@Schema({ timestamps: true, collection: 'contact_activities' })
export class ContactActivity {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contact', required: true, index: true })
  contactId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Campaign', required: true, index: true })
  campaignId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'CampaignRecipient',
    required: true,
    index: true,
  })
  campaignRecipientId!: Types.ObjectId;

  @Prop({ type: String, enum: TRACKING_EVENT_TYPE_VALUES, required: true, index: true })
  eventType!: TrackingEventType;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;

  @Prop({ type: Date, default: () => new Date(), index: true })
  occurredAt!: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ContactActivityDocument = HydratedDocument<ContactActivity>;
export const ContactActivitySchema = SchemaFactory.createForClass(ContactActivity);

ContactActivitySchema.index({ contactId: 1, occurredAt: -1 });
ContactActivitySchema.index({ campaignRecipientId: 1, occurredAt: -1 });
