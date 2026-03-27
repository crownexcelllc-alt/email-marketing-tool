import { Controller, Get } from '@nestjs/common';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('health')
  health(): { module: string; status: string; next: string } {
    return this.importsService.health();
  }
}
