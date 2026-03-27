import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import {
  EMAIL_HEALTH_STATUS_VALUES,
  EMAIL_PROVIDER_VALUES,
  SenderAccountStatus,
  SenderChannelType,
  SenderHealthStatus,
  SenderQualityStatus,
  SENDER_CHANNEL_VALUES,
  SENDER_STATUS_VALUES,
  WHATSAPP_QUALITY_STATUS_VALUES,
} from '../constants/sender-account.enums';

@Schema({ _id: false })
export class SenderSecrets {
  @Prop({ type: String, select: false, default: null })
  smtpPassEncrypted!: string | null;

  @Prop({ type: String, select: false, default: null })
  accessTokenEncrypted!: string | null;

  @Prop({ type: String, select: false, default: null })
  webhookVerifyTokenEncrypted!: string | null;
}

@Schema({ _id: false })
export class EmailSenderConfig {
  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, enum: EMAIL_PROVIDER_VALUES })
  providerType!: string;

  @Prop({ required: true, trim: true })
  smtpHost!: string;

  @Prop({ required: true, min: 1, max: 65535 })
  smtpPort!: number;

  @Prop({ required: true, trim: true })
  smtpUser!: string;

  @Prop({ required: true, default: false })
  secure!: boolean;

  @Prop({ required: true, min: 1, default: 1000 })
  dailyLimit!: number;

  @Prop({ required: true, min: 1, default: 100 })
  hourlyLimit!: number;

  @Prop({ required: true, min: 0, default: 1 })
  minDelaySeconds!: number;

  @Prop({ required: true, min: 0, default: 5 })
  maxDelaySeconds!: number;

  @Prop({ required: true, enum: EMAIL_HEALTH_STATUS_VALUES, default: SenderHealthStatus.UNKNOWN })
  healthStatus!: SenderHealthStatus;
}

@Schema({ _id: false })
export class WhatsappSenderConfig {
  @Prop({ required: true, trim: true })
  phoneNumber!: string;

  @Prop({ required: true, trim: true })
  businessAccountId!: string;

  @Prop({ required: true, trim: true })
  phoneNumberId!: string;

  @Prop({
    required: true,
    enum: WHATSAPP_QUALITY_STATUS_VALUES,
    default: SenderQualityStatus.UNKNOWN,
  })
  qualityStatus!: SenderQualityStatus;
}

@Schema({ timestamps: true, collection: 'sender_accounts' })
export class SenderAccount {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 2, maxlength: 120 })
  name!: string;

  @Prop({ required: true, enum: SENDER_CHANNEL_VALUES, index: true })
  channelType!: SenderChannelType;

  @Prop({
    required: true,
    enum: SENDER_STATUS_VALUES,
    default: SenderAccountStatus.ACTIVE,
    index: true,
  })
  status!: SenderAccountStatus;

  @Prop({ type: Date, default: null })
  lastTestedAt!: Date | null;

  @Prop({ type: EmailSenderConfig, default: null })
  email!: EmailSenderConfig | null;

  @Prop({ type: WhatsappSenderConfig, default: null })
  whatsapp!: WhatsappSenderConfig | null;

  @Prop({ type: SenderSecrets, default: () => ({}) })
  secrets!: SenderSecrets;

  createdAt?: Date;
  updatedAt?: Date;
}

export type SenderAccountDocument = HydratedDocument<SenderAccount>;
export const SenderAccountSchema = SchemaFactory.createForClass(SenderAccount);

SenderAccountSchema.index(
  { workspaceId: 1, channelType: 1, 'email.email': 1 },
  {
    unique: true,
    partialFilterExpression: {
      channelType: SenderChannelType.EMAIL,
      'email.email': { $exists: true },
    },
  },
);

SenderAccountSchema.index(
  { workspaceId: 1, channelType: 1, 'whatsapp.phoneNumberId': 1 },
  {
    unique: true,
    partialFilterExpression: {
      channelType: SenderChannelType.WHATSAPP,
      'whatsapp.phoneNumberId': { $exists: true },
    },
  },
);
