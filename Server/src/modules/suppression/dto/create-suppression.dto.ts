import { Transform } from 'class-transformer';
import { IsEnum, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  SuppressionChannel,
  SuppressionReason,
  SuppressionSource,
} from '../constants/suppression.enums';

export class CreateSuppressionDto {
  @IsEnum(SuppressionChannel)
  readonly channel!: SuppressionChannel;

  @IsOptional()
  @IsMongoId()
  readonly contactId?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(320)
  readonly address?: string;

  @IsEnum(SuppressionReason)
  readonly reason!: SuppressionReason;

  @IsOptional()
  @IsEnum(SuppressionSource)
  readonly source?: SuppressionSource;
}
