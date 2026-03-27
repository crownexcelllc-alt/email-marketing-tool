import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { SettingsController } from './settings.controller';
import { WorkspaceSettings, WorkspaceSettingsSchema } from './schemas/workspace-settings.schema';
import { SettingsService } from './settings.service';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([
      {
        name: WorkspaceSettings.name,
        schema: WorkspaceSettingsSchema,
      },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
