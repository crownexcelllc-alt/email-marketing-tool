import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  ContactEmailStatus,
  ContactSource,
  ContactSubscriptionStatus,
  ContactWhatsappStatus,
} from '../constants/contact.enums';

export class ListContactsDto {
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
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  readonly search?: string;

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
  @IsEnum(ContactEmailStatus)
  readonly emailStatus?: ContactEmailStatus;

  @IsOptional()
  @IsEnum(ContactWhatsappStatus)
  readonly whatsappStatus?: ContactWhatsappStatus;

  @IsOptional()
  @IsEnum(ContactSubscriptionStatus)
  readonly subscriptionStatus?: ContactSubscriptionStatus;

  @IsOptional()
  @IsEnum(ContactSource)
  readonly source?: ContactSource;
}
