import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ContactSource } from '../constants/contact.enums';

export class ImportContactsDto {
  @IsOptional()
  @IsEnum(ContactSource)
  readonly source?: ContactSource;

  @IsOptional()
  @IsBoolean()
  readonly queueOnly?: boolean;
}
