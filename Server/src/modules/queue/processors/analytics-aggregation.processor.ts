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
@Processor(QUEUE_NAMES.ANALYTICS_AGGREGATION, {
  concurrency: QUEUE_CONCURRENCY[QUEUE_NAMES.ANALYTICS_AGGREGATION],
  skipVersionCheck: QUEUE_WORKER_SKIP_VERSION_CHECK,
  skipWaitingForReady: QUEUE_WORKER_SKIP_WAITING_FOR_READY,
})
export class AnalyticsAggregationProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsAggregationProcessor.name);

  async process(job: Job<Record<string, unknown>>): Promise<void> {
    this.logger.log(
      `Processing analytics aggregation placeholder job id=${job.id} name=${job.name} queue=${QUEUE_NAMES.ANALYTICS_AGGREGATION}`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<Record<string, unknown>>, error: Error): void {
    this.logger.error(
      `Analytics aggregation job failed id=${job.id} name=${job.name}: ${error.message}`,
      error.stack,
    );
  }
}
