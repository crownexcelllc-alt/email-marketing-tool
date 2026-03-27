import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { TemplateCategory, TemplateChannelType, TemplateStatus } from '../constants/template.enums';

export class CreateTemplateDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  readonly name!: string;

  @IsEnum(TemplateChannelType)
  readonly channelType!: TemplateChannelType;

  @IsOptional()
  @IsEnum(TemplateCategory)
  readonly category?: TemplateCategory;

  @IsOptional()
  @IsEnum(TemplateStatus)
  readonly status?: TemplateStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly variables?: string[];

  @ValidateIf((dto: CreateTemplateDto) => dto.channelType === TemplateChannelType.EMAIL)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  readonly subject?: string;

  @ValidateIf((dto: CreateTemplateDto) => dto.channelType === TemplateChannelType.EMAIL)
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(300)
  readonly previewText?: string;

  @ValidateIf((dto: CreateTemplateDto) => dto.channelType === TemplateChannelType.EMAIL)
  @Transform(({ value }) => (typeof value === 'string' ? value : String(value ?? '')))
  @IsString()
  @MinLength(1)
  readonly htmlBody?: string;

  @ValidateIf((dto: CreateTemplateDto) => dto.channelType === TemplateChannelType.EMAIL)
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value : String(value ?? '')))
  @IsString()
  readonly textBody?: string;

  @ValidateIf((dto: CreateTemplateDto) => dto.channelType === TemplateChannelType.WHATSAPP)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  readonly templateName?: string;

  @ValidateIf((dto: CreateTemplateDto) => dto.channelType === TemplateChannelType.WHATSAPP)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  readonly language?: string;

  @ValidateIf((dto: CreateTemplateDto) => dto.channelType === TemplateChannelType.WHATSAPP)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly bodyParams?: string[];

  @ValidateIf((dto: CreateTemplateDto) => dto.channelType === TemplateChannelType.WHATSAPP)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly headerParams?: string[];

  @ValidateIf((dto: CreateTemplateDto) => dto.channelType === TemplateChannelType.WHATSAPP)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly buttonParams?: string[];
}
