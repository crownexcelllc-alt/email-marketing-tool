import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  readonly email!: string;

  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits.' })
  readonly code!: string;
}
