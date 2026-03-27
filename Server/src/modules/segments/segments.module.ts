import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { Segment, SegmentSchema } from './schemas/segment.schema';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Segment.name, schema: SegmentSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [SegmentsController],
  providers: [SegmentsService],
  exports: [SegmentsService, MongooseModule],
})
export class SegmentsModule {}
