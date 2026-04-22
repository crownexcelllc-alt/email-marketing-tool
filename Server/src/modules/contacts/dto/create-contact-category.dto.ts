import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

export class CreateContactCategoryDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(80)
  readonly category!: string;
}
