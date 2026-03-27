import { IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { SenderAccountStatus, SenderChannelType } from '../constants/sender-account.enums';

export class ListSenderAccountsDto {
  @IsOptional()
  @IsMongoId()
  readonly workspaceId?: string;

  @IsOptional()
  @IsEnum(SenderChannelType)
  readonly channelType?: SenderChannelType;

  @IsOptional()
  @IsEnum(SenderAccountStatus)
  readonly status?: SenderAccountStatus;
}
