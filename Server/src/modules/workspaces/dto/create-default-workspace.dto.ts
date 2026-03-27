import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDefaultWorkspaceDto {
  @IsMongoId()
  readonly ownerUserId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  readonly ownerFullName!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  readonly name?: string;
}
