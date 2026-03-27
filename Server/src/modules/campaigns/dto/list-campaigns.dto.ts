import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CampaignChannel, CampaignStatus } from '../constants/campaign.enums';

export class ListCampaignsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  readonly limit?: number;

  @IsOptional()
  @IsEnum(CampaignChannel)
  readonly channel?: CampaignChannel;

  @IsOptional()
  @IsEnum(CampaignStatus)
  readonly status?: CampaignStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  readonly search?: string;
}
