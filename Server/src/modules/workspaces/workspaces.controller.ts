import { Controller, Get } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get('health')
  health(): { module: string; status: string; next: string } {
    return this.workspacesService.health();
  }
}
