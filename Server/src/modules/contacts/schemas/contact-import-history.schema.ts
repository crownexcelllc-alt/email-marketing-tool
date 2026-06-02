import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'contact_import_history' })
export class ContactImportHistory {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  importName!: string;

  @Prop({ type: String, required: true, trim: true })
  fileName!: string;

  @Prop({ type: Number, default: 0, min: 0 })
  total!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  created!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  skipped!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  invalid!: number;

  /** Category assigned to this batch (if any) */
  @Prop({ type: String, default: '' })
  category!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ContactImportHistoryDocument = HydratedDocument<ContactImportHistory>;
export const ContactImportHistorySchema = SchemaFactory.createForClass(ContactImportHistory);

ContactImportHistorySchema.index({ workspaceId: 1, createdAt: -1 });
