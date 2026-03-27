import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  SUPPRESSION_CHANNEL_VALUES,
  SUPPRESSION_REASON_VALUES,
  SUPPRESSION_SOURCE_VALUES,
  SuppressionChannel,
  SuppressionReason,
  SuppressionSource,
} from '../constants/suppression.enums';

@Schema({ timestamps: true, collection: 'suppressions' })
export class Suppression {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Contact', default: null, index: true })
  contactId!: Types.ObjectId | null;

  @Prop({ type: String, enum: SUPPRESSION_CHANNEL_VALUES, required: true, index: true })
  channel!: SuppressionChannel;

  @Prop({ type: String, required: true, trim: true })
  address!: string;

  @Prop({ type: String, required: true, select: false })
  addressNormalized!: string;

  @Prop({ type: String, enum: SUPPRESSION_REASON_VALUES, required: true, index: true })
  reason!: SuppressionReason;

  @Prop({ type: String, enum: SUPPRESSION_SOURCE_VALUES, default: SuppressionSource.MANUAL })
  source!: SuppressionSource;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export type SuppressionDocument = HydratedDocument<Suppression>;
export const SuppressionSchema = SchemaFactory.createForClass(Suppression);

SuppressionSchema.index({ workspaceId: 1, channel: 1, addressNormalized: 1 }, { unique: true });

SuppressionSchema.index(
  { workspaceId: 1, channel: 1, contactId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      contactId: { $type: 'objectId', $exists: true },
    },
  },
);

SuppressionSchema.index({ workspaceId: 1, createdAt: -1 });
