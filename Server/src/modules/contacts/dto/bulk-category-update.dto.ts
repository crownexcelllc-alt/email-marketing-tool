import { ArrayMinSize, IsArray, IsMongoId, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class BulkCategoryUpdateDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  readonly ids!: string[];

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(80)
  readonly category!: string;
}
