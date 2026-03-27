import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  EmailProviderType,
  SenderAccountStatus,
  SenderHealthStatus,
  SenderQualityStatus,
} from '../constants/sender-account.enums';

export class UpdateSenderAccountDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  readonly name?: string;

  @IsOptional()
  @IsEnum(SenderAccountStatus)
  readonly status?: SenderAccountStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  readonly email?: string;

  @IsOptional()
  @IsEnum(EmailProviderType)
  readonly providerType?: EmailProviderType;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  readonly smtpHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  readonly smtpPort?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  readonly smtpUser?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  readonly smtpPass?: string;

  @IsOptional()
  @IsBoolean()
  readonly secure?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly dailyLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly hourlyLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly minDelaySeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly maxDelaySeconds?: number;

  @IsOptional()
  @IsEnum(SenderHealthStatus)
  readonly healthStatus?: SenderHealthStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^\+?[1-9]\d{6,14}$/)
  readonly phoneNumber?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  readonly businessAccountId?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  readonly phoneNumberId?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(2000)
  readonly accessToken?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(500)
  readonly webhookVerifyToken?: string;

  @IsOptional()
  @IsEnum(SenderQualityStatus)
  readonly qualityStatus?: SenderQualityStatus;
}
