import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  EmailProviderType,
  SenderAccountStatus,
  SenderChannelType,
  SenderHealthStatus,
  SenderQualityStatus,
} from '../constants/sender-account.enums';

export class CreateSenderAccountDto {
  @IsMongoId()
  readonly workspaceId!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  readonly name!: string;

  @IsEnum(SenderChannelType)
  readonly channelType!: SenderChannelType;

  @IsOptional()
  @IsEnum(SenderAccountStatus)
  readonly status?: SenderAccountStatus;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  readonly email?: string;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @IsEnum(EmailProviderType)
  readonly providerType?: EmailProviderType;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  readonly smtpHost?: string;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @IsInt()
  @Min(1)
  @Max(65535)
  readonly smtpPort?: number;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  readonly smtpUser?: string;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  readonly smtpPass?: string;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @IsBoolean()
  readonly secure?: boolean;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @IsInt()
  @Min(1)
  readonly dailyLimit?: number;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @IsInt()
  @Min(1)
  readonly hourlyLimit?: number;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @IsInt()
  @Min(0)
  readonly minDelaySeconds?: number;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @IsInt()
  @Min(0)
  readonly maxDelaySeconds?: number;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.EMAIL)
  @IsOptional()
  @IsEnum(SenderHealthStatus)
  readonly healthStatus?: SenderHealthStatus;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.WHATSAPP)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/)
  readonly phoneNumber?: string;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.WHATSAPP)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  readonly businessAccountId?: string;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.WHATSAPP)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  readonly phoneNumberId?: string;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.WHATSAPP)
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  readonly accessToken?: string;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.WHATSAPP)
  @IsString()
  @MinLength(6)
  @MaxLength(500)
  readonly webhookVerifyToken?: string;

  @ValidateIf((dto: CreateSenderAccountDto) => dto.channelType === SenderChannelType.WHATSAPP)
  @IsOptional()
  @IsEnum(SenderQualityStatus)
  readonly qualityStatus?: SenderQualityStatus;
}
