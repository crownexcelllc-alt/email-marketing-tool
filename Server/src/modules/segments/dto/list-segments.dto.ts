import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ContactSubscriptionStatus } from '../../contacts/constants/contact.enums';
import { SegmentType } from '../constants/segment.enums';

export class ListSegmentsDto {
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
  @IsString()
  readonly search?: string;

  @IsOptional()
  @IsEnum(SegmentType)
  readonly type?: SegmentType;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
    }

    return [];
  })
  @IsArray()
  @IsString({ each: true })
  readonly tags?: string[];

  @IsOptional()
  @IsEnum(ContactSubscriptionStatus)
  readonly subscriptionStatus?: ContactSubscriptionStatus;
}
