import { Controller, Get } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('health')
  health(): {
    module: string;
    status: string;
    queues: string[];
    concurrency: Record<string, number>;
  } {
    return this.queueService.health();
  }
}
