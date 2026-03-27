import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CampaignRecipient,
  CampaignRecipientSchema,
} from '../campaigns/schemas/campaign-recipient.schema';
import { Campaign, CampaignSchema } from '../campaigns/schemas/campaign.schema';
import { ContactActivity, ContactActivitySchema } from './schemas/contact-activity.schema';
import { TrackingEvent, TrackingEventSchema } from './schemas/tracking-event.schema';
import { TrackingAggregationService } from './tracking-aggregation.service';
import { TrackingController } from './tracking.controller';
import { TrackingLinkService } from './tracking-link.service';
import { TrackingService } from './tracking.service';
import { TrackingTokenService } from './tracking-token.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignRecipient.name, schema: CampaignRecipientSchema },
      { name: TrackingEvent.name, schema: TrackingEventSchema },
      { name: ContactActivity.name, schema: ContactActivitySchema },
    ]),
  ],
  controllers: [TrackingController],
  providers: [
    TrackingService,
    TrackingTokenService,
    TrackingLinkService,
    TrackingAggregationService,
  ],
  exports: [TrackingService, TrackingLinkService],
})
export class TrackingModule {}
