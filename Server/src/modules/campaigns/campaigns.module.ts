import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { Segment, SegmentSchema } from '../segments/schemas/segment.schema';
import {
  SenderAccount,
  SenderAccountSchema,
} from '../sender-accounts/schemas/sender-account.schema';
import { Template, TemplateSchema } from '../templates/schemas/template.schema';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CampaignDistributionService } from './campaign-distribution.service';
import { CampaignRecipient, CampaignRecipientSchema } from './schemas/campaign-recipient.schema';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Campaign.name, schema: CampaignSchema },
      { name: CampaignRecipient.name, schema: CampaignRecipientSchema },
      { name: SenderAccount.name, schema: SenderAccountSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: Segment.name, schema: SegmentSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignDistributionService],
  exports: [CampaignsService, CampaignDistributionService, MongooseModule],
})
export class CampaignsModule {}
