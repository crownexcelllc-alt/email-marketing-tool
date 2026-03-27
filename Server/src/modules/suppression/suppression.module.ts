import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { Suppression, SuppressionSchema } from './schemas/suppression.schema';
import { SuppressionController } from './suppression.controller';
import { SuppressionService } from './suppression.service';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Suppression.name, schema: SuppressionSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [SuppressionController],
  providers: [SuppressionService],
  exports: [SuppressionService, MongooseModule],
})
export class SuppressionModule {}
