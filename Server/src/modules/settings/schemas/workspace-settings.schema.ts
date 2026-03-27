import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

@Schema({ _id: false })
export class ProfileSettings {
  @Prop({ default: '' })
  fullName!: string;

  @Prop({ default: '' })
  email!: string;

  @Prop({ default: 'UTC' })
  timezone!: string;
}

@Schema({ _id: false })
export class SmtpSettings {
  @Prop({ default: '' })
  defaultFromName!: string;

  @Prop({ default: '' })
  defaultFromEmail!: string;

  @Prop({ default: '' })
  replyToEmail!: string;

  @Prop({ default: '' })
  providerType!: string;

  @Prop({ default: true })
  trackReplies!: boolean;
}

@Schema({ _id: false })
export class WhatsAppSettings {
  @Prop({ default: '' })
  businessAccountId!: string;

  @Prop({ default: '' })
  phoneNumberId!: string;

  @Prop({ default: '' })
  webhookVerifyToken!: string;

  @Prop({ default: 'en' })
  defaultLanguage!: string;
}

@Schema({ _id: false })
export class SendingLimitsSettings {
  @Prop({ default: 5000 })
  dailyLimit!: number;

  @Prop({ default: 500 })
  hourlyLimit!: number;

  @Prop({ default: 1 })
  minDelaySeconds!: number;

  @Prop({ default: 10 })
  maxDelaySeconds!: number;

  @Prop({ default: true })
  respectSenderLimits!: boolean;
}

@Schema({ _id: false })
export class TrackingSettings {
  @Prop({ default: true })
  trackOpens!: boolean;

  @Prop({ default: true })
  trackClicks!: boolean;

  @Prop({ default: true })
  appendUtm!: boolean;

  @Prop({ default: 'marketing-platform' })
  utmSource!: string;

  @Prop({ default: 'campaign' })
  utmMedium!: string;
}

@Schema({ timestamps: true, collection: 'workspace_settings' })
export class WorkspaceSettings {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, unique: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: ProfileSettings, default: () => ({}) })
  profile!: ProfileSettings;

  @Prop({ type: SmtpSettings, default: () => ({}) })
  smtp!: SmtpSettings;

  @Prop({ type: WhatsAppSettings, default: () => ({}) })
  whatsapp!: WhatsAppSettings;

  @Prop({ type: SendingLimitsSettings, default: () => ({}) })
  sendingLimits!: SendingLimitsSettings;

  @Prop({ type: TrackingSettings, default: () => ({}) })
  tracking!: TrackingSettings;
}

export type WorkspaceSettingsDocument = HydratedDocument<WorkspaceSettings>;
export const WorkspaceSettingsSchema = SchemaFactory.createForClass(WorkspaceSettings);
