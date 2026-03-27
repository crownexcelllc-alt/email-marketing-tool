import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SegmentType } from '../constants/segment.enums';
import { SegmentFiltersDto } from './segment-filters.dto';

export class UpdateSegmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  readonly name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string;

  @IsOptional()
  @IsEnum(SegmentType)
  readonly type?: SegmentType;

  @IsOptional()
  @ValidateNested()
  @Type(() => SegmentFiltersDto)
  readonly filters?: SegmentFiltersDto;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  readonly contactIds?: string[];
}
