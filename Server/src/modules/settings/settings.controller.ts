import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@CurrentUser() authUser: AuthUser): Promise<{
    settings: Awaited<ReturnType<SettingsService['getSettings']>>;
  }> {
    const settings = await this.settingsService.getSettings(authUser);
    return { settings };
  }

  @Patch()
  async updateSettings(
    @Body() patch: unknown,
    @CurrentUser() authUser: AuthUser,
  ): Promise<{
    settings: Awaited<ReturnType<SettingsService['updateSettings']>>;
  }> {
    const settings = await this.settingsService.updateSettings(patch, authUser);
    return { settings };
  }
}
