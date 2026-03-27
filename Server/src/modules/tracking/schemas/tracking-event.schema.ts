import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { TRACKING_EVENT_TYPE_VALUES, TrackingEventType } from '../constants/tracking.enums';

@Schema({ timestamps: true, collection: 'tracking_events' })
export class TrackingEvent {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Campaign', required: true, index: true })
  campaignId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'CampaignRecipient',
    required: true,
    index: true,
  })
  campaignRecipientId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contact', required: true, index: true })
  contactId!: Types.ObjectId;

  @Prop({ type: String, enum: TRACKING_EVENT_TYPE_VALUES, required: true, index: true })
  eventType!: TrackingEventType;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata!: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export type TrackingEventDocument = HydratedDocument<TrackingEvent>;
export const TrackingEventSchema = SchemaFactory.createForClass(TrackingEvent);

TrackingEventSchema.index({ campaignRecipientId: 1, eventType: 1, createdAt: -1 });
TrackingEventSchema.index({ campaignId: 1, eventType: 1, createdAt: -1 });
