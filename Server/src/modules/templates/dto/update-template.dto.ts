import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TemplateCategory, TemplateStatus } from '../constants/template.enums';

export class UpdateTemplateDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  readonly name?: string;

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

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  readonly subject?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(300)
  readonly previewText?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value : String(value ?? '')))
  @IsString()
  @MinLength(1)
  readonly htmlBody?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value : String(value ?? '')))
  @IsString()
  readonly textBody?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  readonly templateName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  readonly language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly bodyParams?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly headerParams?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly buttonParams?: string[];
}
