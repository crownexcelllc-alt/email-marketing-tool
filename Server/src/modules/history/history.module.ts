import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CampaignRecipient,
  CampaignRecipientSchema,
} from '../campaigns/schemas/campaign-recipient.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { SendEvent, SendEventSchema } from '../email/schemas/send-event.schema';
import { AuthModule } from '../auth/auth.module';
import {
  ContactActivity,
  ContactActivitySchema,
} from '../tracking/schemas/contact-activity.schema';
import { TrackingEvent, TrackingEventSchema } from '../tracking/schemas/tracking-event.schema';
import {
  WhatsappWebhookEvent,
  WhatsappWebhookEventSchema,
} from '../webhooks/schemas/whatsapp-webhook-event.schema';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: SendEvent.name, schema: SendEventSchema },
      { name: TrackingEvent.name, schema: TrackingEventSchema },
      { name: ContactActivity.name, schema: ContactActivitySchema },
      { name: WhatsappWebhookEvent.name, schema: WhatsappWebhookEventSchema },
      { name: CampaignRecipient.name, schema: CampaignRecipientSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class HistoryModule {}
