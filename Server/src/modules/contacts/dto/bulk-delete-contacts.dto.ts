import { ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class BulkDeleteContactsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  readonly ids!: string[];
}
