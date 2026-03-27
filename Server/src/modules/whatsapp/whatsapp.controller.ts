import { Controller, Get } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('health')
  health(): { module: string; status: string; next: string } {
    return this.whatsappService.health();
  }
}
