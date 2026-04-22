import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import {
  QUEUE_CONCURRENCY,
  QUEUE_DEFAULT_JOB_OPTIONS,
  QUEUE_NAMES,
  QUEUE_WORKERS_ENABLED,
  QueueName,
  REGISTERED_QUEUES,
} from './queue.constants';

type QueuePayload = Record<string, unknown>;

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(QUEUE_NAMES.CONTACT_IMPORT)
    private readonly contactImportQueue: Queue<QueuePayload>,
    @InjectQueue(QUEUE_NAMES.CAMPAIGN_SCHEDULER)
    private readonly campaignSchedulerQueue: Queue<QueuePayload>,
    @InjectQueue(QUEUE_NAMES.EMAIL_SEND)
    private readonly emailSendQueue: Queue<QueuePayload>,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_SEND)
    private readonly whatsappSendQueue: Queue<QueuePayload>,
    @InjectQueue(QUEUE_NAMES.WEBHOOK_PROCESSING)
    private readonly webhookProcessingQueue: Queue<QueuePayload>,
    @InjectQueue(QUEUE_NAMES.ANALYTICS_AGGREGATION)
    private readonly analyticsAggregationQueue: Queue<QueuePayload>,
  ) {}

  health(): {
    module: string;
    status: string;
    queues: string[];
    workersEnabled: boolean;
    concurrency: Record<string, number>;
    defaults: JobsOptions;
  } {
    return {
      module: 'queue',
      status: 'ready',
      queues: REGISTERED_QUEUES,
      workersEnabled: QUEUE_WORKERS_ENABLED,
      concurrency: QUEUE_CONCURRENCY,
      defaults: QUEUE_DEFAULT_JOB_OPTIONS,
    };
  }

  async enqueue(
    queueName: QueueName,
    jobName: string,
    payload: QueuePayload,
    options?: JobsOptions,
  ): Promise<{ id: string; queue: QueueName; name: string }> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, payload, {
      ...QUEUE_DEFAULT_JOB_OPTIONS,
      ...options,
    });

    return {
      id: String(job.id),
      queue: queueName,
      name: job.name,
    };
  }

  enqueueContactImport(payload: QueuePayload, options?: JobsOptions): Promise<{ id: string }> {
    return this.enqueueSimple(
      QUEUE_NAMES.CONTACT_IMPORT,
      'contact-import.process',
      payload,
      options,
    );
  }

  enqueueCampaignScheduler(payload: QueuePayload, options?: JobsOptions): Promise<{ id: string }> {
    return this.enqueueSimple(
      QUEUE_NAMES.CAMPAIGN_SCHEDULER,
      'campaign-scheduler.tick',
      payload,
      options,
    );
  }

  enqueueEmailSend(payload: QueuePayload, options?: JobsOptions): Promise<{ id: string }> {
    return this.enqueueSimple(QUEUE_NAMES.EMAIL_SEND, 'email-send.dispatch', payload, options);
  }

  enqueueWhatsappSend(payload: QueuePayload, options?: JobsOptions): Promise<{ id: string }> {
    return this.enqueueSimple(
      QUEUE_NAMES.WHATSAPP_SEND,
      'whatsapp-send.dispatch',
      payload,
      options,
    );
  }

  enqueueWebhookProcessing(payload: QueuePayload, options?: JobsOptions): Promise<{ id: string }> {
    return this.enqueueSimple(
      QUEUE_NAMES.WEBHOOK_PROCESSING,
      'webhook-processing.handle',
      payload,
      options,
    );
  }

  enqueueAnalyticsAggregation(
    payload: QueuePayload,
    options?: JobsOptions,
  ): Promise<{ id: string }> {
    return this.enqueueSimple(
      QUEUE_NAMES.ANALYTICS_AGGREGATION,
      'analytics-aggregation.rollup',
      payload,
      options,
    );
  }

  private async enqueueSimple(
    queueName: QueueName,
    jobName: string,
    payload: QueuePayload,
    options?: JobsOptions,
  ): Promise<{ id: string }> {
    const result = await this.enqueue(queueName, jobName, payload, options);
    return { id: result.id };
  }

  private getQueue(queueName: QueueName): Queue<QueuePayload> {
    switch (queueName) {
      case QUEUE_NAMES.CONTACT_IMPORT:
        return this.contactImportQueue;
      case QUEUE_NAMES.CAMPAIGN_SCHEDULER:
        return this.campaignSchedulerQueue;
      case QUEUE_NAMES.EMAIL_SEND:
        return this.emailSendQueue;
      case QUEUE_NAMES.WHATSAPP_SEND:
        return this.whatsappSendQueue;
      case QUEUE_NAMES.WEBHOOK_PROCESSING:
        return this.webhookProcessingQueue;
      case QUEUE_NAMES.ANALYTICS_AGGREGATION:
        return this.analyticsAggregationQueue;
      default:
        throw new Error(`Queue not configured: ${queueName as string}`);
    }
  }
}
