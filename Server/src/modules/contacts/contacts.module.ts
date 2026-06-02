import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { ContactImportHistory, ContactImportHistorySchema } from './schemas/contact-import-history.schema';
import { ContactsController } from './contacts.controller';
import { ContactsImportJobService } from './contacts-import-job.service';
import { ContactsImportService } from './contacts-import.service';
import { ContactsService } from './contacts.service';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
      { name: ContactImportHistory.name, schema: ContactImportHistorySchema },
    ]),
  ],
  controllers: [ContactsController],
  providers: [ContactsService, ContactsImportService, ContactsImportJobService],
  exports: [ContactsService, MongooseModule],
})
export class ContactsModule {}
