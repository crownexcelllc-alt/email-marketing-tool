import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CampaignRecipient,
  CampaignRecipientSchema,
} from '../campaigns/schemas/campaign-recipient.schema';
import { Campaign, CampaignSchema } from '../campaigns/schemas/campaign.schema';
import { SendEvent, SendEventSchema } from '../email/schemas/send-event.schema';
import { SenderAccountsModule } from '../sender-accounts/sender-accounts.module';
import {
  SenderAccount,
  SenderAccountSchema,
} from '../sender-accounts/schemas/sender-account.schema';
import { WebhooksController } from './webhooks.controller';
import {
  WhatsappWebhookEvent,
  WhatsappWebhookEventSchema,
} from './schemas/whatsapp-webhook-event.schema';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [
    SenderAccountsModule,
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignRecipient.name, schema: CampaignRecipientSchema },
      { name: SendEvent.name, schema: SendEventSchema },
      { name: SenderAccount.name, schema: SenderAccountSchema },
      { name: WhatsappWebhookEvent.name, schema: WhatsappWebhookEventSchema },
    ]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
