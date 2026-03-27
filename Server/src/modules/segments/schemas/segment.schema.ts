import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  CONTACT_EMAIL_STATUS_VALUES,
  CONTACT_SUBSCRIPTION_STATUS_VALUES,
  CONTACT_WHATSAPP_STATUS_VALUES,
  ContactEmailStatus,
  ContactSubscriptionStatus,
  ContactWhatsappStatus,
} from '../../contacts/constants/contact.enums';
import { SEGMENT_TYPE_VALUES, SegmentType } from '../constants/segment.enums';

@Schema({ _id: false })
export class SegmentFilters {
  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: String, enum: CONTACT_SUBSCRIPTION_STATUS_VALUES, default: null })
  subscriptionStatus!: ContactSubscriptionStatus | null;

  @Prop({ type: String, enum: CONTACT_EMAIL_STATUS_VALUES, default: null })
  emailStatus!: ContactEmailStatus | null;

  @Prop({ type: String, enum: CONTACT_WHATSAPP_STATUS_VALUES, default: null })
  whatsappStatus!: ContactWhatsappStatus | null;
}

@Schema({ timestamps: true, collection: 'segments' })
export class Segment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  name!: string;

  @Prop({ type: String, default: '' })
  description!: string;

  @Prop({ type: String, enum: SEGMENT_TYPE_VALUES, default: SegmentType.STATIC, index: true })
  type!: SegmentType;

  @Prop({ type: SegmentFilters, default: () => ({ tags: [] }) })
  filters!: SegmentFilters;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'Contact', default: [] })
  contactIds!: Types.ObjectId[];

  @Prop({ type: Number, default: 0, min: 0 })
  estimatedCount!: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export type SegmentDocument = HydratedDocument<Segment>;
export const SegmentSchema = SchemaFactory.createForClass(Segment);

SegmentSchema.index({ workspaceId: 1, name: 1 });
SegmentSchema.index({ workspaceId: 1, type: 1 });
