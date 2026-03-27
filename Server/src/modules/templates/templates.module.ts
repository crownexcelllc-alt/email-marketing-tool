import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Contact, ContactSchema } from '../contacts/schemas/contact.schema';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { Template, TemplateSchema } from './schemas/template.schema';
import { TemplatesController } from './templates.controller';
import { TemplatesPreviewService } from './templates-preview.service';
import { TemplatesService } from './templates.service';
import { TemplatesVariableService } from './templates-variable.service';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
      { name: Contact.name, schema: ContactSchema },
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplatesVariableService, TemplatesPreviewService],
  exports: [TemplatesService, MongooseModule],
})
export class TemplatesModule {}
