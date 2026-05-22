import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true, collection: 'otp_verifications' })
export class OtpVerification {
  @Prop({ required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ required: true })
  otpCode!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ trim: true })
  workspaceName?: string;

  createdAt!: Date;
  updatedAt!: Date;
}


export type OtpVerificationDocument = HydratedDocument<OtpVerification>;
export const OtpVerificationSchema = SchemaFactory.createForClass(OtpVerification);

// Add TTL index to automatically delete records after expiration
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpVerificationSchema.index({ email: 1 }, { unique: true });
