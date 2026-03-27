import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CampaignRecipient,
  CampaignRecipientSchema,
} from '../campaigns/schemas/campaign-recipient.schema';
import { Campaign, CampaignSchema } from '../campaigns/schemas/campaign.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import {
  SenderAccount,
  SenderAccountSchema,
} from '../sender-accounts/schemas/sender-account.schema';
import { SenderAccountsModule } from '../sender-accounts/sender-accounts.module';
import { SuppressionModule } from '../suppression/suppression.module';
import { Template, TemplateSchema } from '../templates/schemas/template.schema';
import { TrackingModule } from '../tracking/tracking.module';
import { EmailController } from './email.controller';
import { SendEvent, SendEventSchema } from './schemas/send-event.schema';
import { EmailService } from './email.service';

@Module({
  imports: [
    SenderAccountsModule,
    SuppressionModule,
    TrackingModule,
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignRecipient.name, schema: CampaignRecipientSchema },
      { name: SenderAccount.name, schema: SenderAccountSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: SendEvent.name, schema: SendEventSchema },
    ]),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService, MongooseModule],
})
export class EmailModule {}
