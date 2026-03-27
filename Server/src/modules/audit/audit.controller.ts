import { Controller, Get } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('health')
  health(): { module: string; status: string; next: string } {
    return this.auditService.health();
  }
}
