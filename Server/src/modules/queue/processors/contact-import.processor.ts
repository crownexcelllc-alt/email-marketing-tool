import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  QUEUE_CONCURRENCY,
  QUEUE_NAMES,
  QUEUE_WORKER_SKIP_VERSION_CHECK,
  QUEUE_WORKER_SKIP_WAITING_FOR_READY,
} from '../queue.constants';

@Injectable()
@Processor(QUEUE_NAMES.CONTACT_IMPORT, {
  concurrency: QUEUE_CONCURRENCY[QUEUE_NAMES.CONTACT_IMPORT],
  skipVersionCheck: QUEUE_WORKER_SKIP_VERSION_CHECK,
  skipWaitingForReady: QUEUE_WORKER_SKIP_WAITING_FOR_READY,
})
export class ContactImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ContactImportProcessor.name);

  async process(job: Job<Record<string, unknown>>): Promise<void> {
    this.logger.log(
      `Processing contact import placeholder job id=${job.id} name=${job.name} queue=${QUEUE_NAMES.CONTACT_IMPORT}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<Record<string, unknown>>, error: Error): void {
    this.logger.error(
      `Contact import job failed id=${job.id} name=${job.name}: ${error.message}`,
      error.stack,
    );
  }
}
