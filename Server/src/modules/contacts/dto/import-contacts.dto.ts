import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactSource } from '../constants/contact.enums';

export class ImportContactsDto {
  @IsOptional()
  @IsEnum(ContactSource)
  readonly source?: ContactSource;

  @IsOptional()
  @IsBoolean()
  readonly queueOnly?: boolean;

  @IsOptional()
  @IsString()
  readonly category?: string;

  /** User-provided name for this import batch (used as a label on contacts and saved to history). */
  @IsOptional()
  @IsString()
  readonly importName?: string;
}
