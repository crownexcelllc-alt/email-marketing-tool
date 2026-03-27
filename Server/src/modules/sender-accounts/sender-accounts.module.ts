import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SenderAccountsController } from './sender-accounts.controller';
import { SenderAccountSecretsService } from './sender-account-secrets.service';
import { SenderAccountsService } from './sender-accounts.service';
import { SenderAccount, SenderAccountSchema } from './schemas/sender-account.schema';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    MongooseModule.forFeature([{ name: SenderAccount.name, schema: SenderAccountSchema }]),
  ],
  controllers: [SenderAccountsController],
  providers: [SenderAccountsService, SenderAccountSecretsService],
  exports: [SenderAccountsService, SenderAccountSecretsService, MongooseModule],
})
export class SenderAccountsModule {}
