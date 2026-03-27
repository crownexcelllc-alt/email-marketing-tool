import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_CONCURRENCY, QUEUE_NAMES } from '../queue.constants';

@Injectable()
@Processor(QUEUE_NAMES.WEBHOOK_PROCESSING, {
  concurrency: QUEUE_CONCURRENCY[QUEUE_NAMES.WEBHOOK_PROCESSING],
})
export class WebhookProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessingProcessor.name);

  async process(job: Job<Record<string, unknown>>): Promise<void> {
    this.logger.log(
      `Processing webhook placeholder job id=${job.id} name=${job.name} queue=${QUEUE_NAMES.WEBHOOK_PROCESSING}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<Record<string, unknown>>, error: Error): void {
    this.logger.error(
      `Webhook processing job failed id=${job.id} name=${job.name}: ${error.message}`,
      error.stack,
    );
  }
}
