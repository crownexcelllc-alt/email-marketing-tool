import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class SampleContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  readonly fullName?: string;

  @IsOptional()
  @IsString()
  readonly email?: string;

  @IsOptional()
  @IsString()
  readonly phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  readonly company?: string;

  @IsOptional()
  @IsObject()
  readonly customFields?: Record<string, unknown>;
}

export class PreviewTemplateDto {
  @IsOptional()
  @IsMongoId()
  readonly contactId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SampleContactDto)
  readonly sampleContact?: SampleContactDto;
}
