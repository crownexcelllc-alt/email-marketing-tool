import { ArrayMinSize, ArrayUnique, IsArray, IsMongoId } from 'class-validator';

export class AddSegmentContactsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsMongoId({ each: true })
  readonly contactIds!: string[];
}
