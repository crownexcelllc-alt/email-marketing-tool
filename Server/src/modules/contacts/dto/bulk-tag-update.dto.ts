import { ArrayMinSize, IsArray, IsMongoId, IsOptional, IsString } from 'class-validator';

export class BulkTagUpdateDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  readonly ids!: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly addLabels?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly removeLabels?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly setLabels?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly addTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly removeTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly setTags?: string[];
}
