import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { CampaignChannel } from '../../modules/campaigns/constants/campaign.enums';

const normalizeCsvArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
};

export class EventQueryFiltersDto {
  @IsOptional()
  @IsMongoId()
  readonly campaignId?: string;

  @IsOptional()
  @IsMongoId()
  readonly contactId?: string;

  @IsOptional()
  @IsMongoId()
  readonly senderId?: string;

  @IsOptional()
  @IsEnum(CampaignChannel)
  readonly channel?: CampaignChannel;

  @IsOptional()
  @Transform(({ value }) => normalizeCsvArray(value))
  @IsArray()
  @IsString({ each: true })
  readonly eventType?: string[];

  @IsOptional()
  @IsDateString()
  readonly dateFrom?: string;

  @IsOptional()
  @IsDateString()
  readonly dateTo?: string;
}
