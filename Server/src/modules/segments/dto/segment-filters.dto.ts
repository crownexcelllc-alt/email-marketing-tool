import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  ContactEmailStatus,
  ContactSubscriptionStatus,
  ContactWhatsappStatus,
} from '../../contacts/constants/contact.enums';

export class SegmentFiltersDto {
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

  @IsOptional()
  @IsEnum(ContactEmailStatus)
  readonly emailStatus?: ContactEmailStatus;

  @IsOptional()
  @IsEnum(ContactWhatsappStatus)
  readonly whatsappStatus?: ContactWhatsappStatus;
}
