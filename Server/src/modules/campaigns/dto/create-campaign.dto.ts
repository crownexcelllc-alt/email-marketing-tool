import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  CampaignChannel,
  CampaignDistributionStrategy,
  CampaignStatus,
} from '../constants/campaign.enums';

class CampaignSettingsDto {
  @IsOptional()
  @IsEnum(CampaignDistributionStrategy)
  readonly distributionStrategy?: CampaignDistributionStrategy;
}

export class CreateCampaignDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  readonly name!: string;

  @IsEnum(CampaignChannel)
  readonly channel!: CampaignChannel;

  @IsArray()
  @IsMongoId({ each: true })
  readonly senderAccountIds!: string[];

  @IsOptional()
  @IsMongoId()
  readonly segmentId?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  readonly contactIds?: string[];

  @IsMongoId()
  readonly templateId!: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  readonly status?: CampaignStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(80)
  readonly timezone?: string;

  @IsOptional()
  @IsDateString()
  readonly startAt?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(5)
  readonly sendingWindowStart?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(5)
  readonly sendingWindowEnd?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly dailyCap?: number;

  @IsOptional()
  @IsBoolean()
  readonly trackOpens?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly trackClicks?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly randomDelayMinSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  readonly randomDelayMaxSeconds?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  readonly settings?: CampaignSettingsDto;
}
