import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CampaignRecipient,
  CampaignRecipientSchema,
} from '../campaigns/schemas/campaign-recipient.schema';
import { Campaign, CampaignSchema } from '../campaigns/schemas/campaign.schema';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { EmailModule } from '../email/email.module';
import { Segment, SegmentSchema } from '../segments/schemas/segment.schema';
import {
  SenderAccount,
  SenderAccountSchema,
} from '../sender-accounts/schemas/sender-account.schema';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AnalyticsAggregationProcessor } from './processors/analytics-aggregation.processor';
import { CampaignSchedulerProcessor } from './processors/campaign-scheduler.processor';
import { ContactImportProcessor } from './processors/contact-import.processor';
import { EmailSendProcessor } from './processors/email-send.processor';
import { WebhookProcessingProcessor } from './processors/webhook-processing.processor';
import { WhatsappSendProcessor } from './processors/whatsapp-send.processor';
import { QUEUE_DEFAULT_JOB_OPTIONS, REGISTERED_QUEUES } from './queue.constants';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [
    EmailModule,
    WhatsappModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', { infer: true }),
          port: configService.get<number>('redis.port', { infer: true }),
          password: configService.get<string>('redis.password', { infer: true }),
          db: configService.get<number>('redis.db', { infer: true }),
        },
        prefix: configService.get<string>('redis.keyPrefix', { infer: true }),
        skipVersionCheck: configService.get<boolean>('redis.skipVersionCheck', {
          infer: true,
        }),
        defaultJobOptions: QUEUE_DEFAULT_JOB_OPTIONS,
      }),
    }),
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignRecipient.name, schema: CampaignRecipientSchema },
      { name: SenderAccount.name, schema: SenderAccountSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Segment.name, schema: SegmentSchema },
    ]),
    BullModule.registerQueue(...REGISTERED_QUEUES.map((name) => ({ name }))),
  ],
  controllers: [QueueController],
  providers: [
    QueueService,
    ContactImportProcessor,
    CampaignSchedulerProcessor,
    EmailSendProcessor,
    WhatsappSendProcessor,
    WebhookProcessingProcessor,
    AnalyticsAggregationProcessor,
  ],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
