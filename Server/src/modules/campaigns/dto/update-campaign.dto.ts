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
import { CampaignChannel, CampaignDistributionStrategy } from '../constants/campaign.enums';

class CampaignSettingsDto {
  @IsOptional()
  @IsEnum(CampaignDistributionStrategy)
  readonly distributionStrategy?: CampaignDistributionStrategy;
}

export class UpdateCampaignDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(140)
  readonly name?: string;

  @IsOptional()
  @IsEnum(CampaignChannel)
  readonly channel?: CampaignChannel;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  readonly senderAccountIds?: string[];

  @IsOptional()
  @IsMongoId()
  readonly segmentId?: string | null;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  readonly contactIds?: string[];

  @IsOptional()
  @IsMongoId()
  readonly templateId?: string;

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
  readonly sendingWindowStart?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(5)
  readonly sendingWindowEnd?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  readonly dailyCap?: number | null;

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
