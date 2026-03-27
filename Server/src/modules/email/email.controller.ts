import { Controller, Get } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('health')
  health(): { module: string; status: string; next: string } {
    return this.emailService.health();
  }
}
