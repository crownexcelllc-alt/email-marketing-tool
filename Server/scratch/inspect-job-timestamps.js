const { Queue } = require('bullmq');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
};

const prefix = process.env.BULLMQ_PREFIX || 'marketing-platform';

async function run() {
  const queueName = 'campaign-scheduler';
  const queue = new Queue(queueName, { connection, prefix });

  try {
    const job = await queue.getJob('campaign-limit-resume-6a11b32c877123c91412cdac');
    if (!job) {
      console.log('Job not found!');
      return;
    }
    console.log('Job found:');
    console.log({
      id: job.id,
      name: job.name,
      timestamp: new Date(job.timestamp).toISOString(),
      processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      delay: job.delay,
      opts: job.opts,
      state: await job.getState(),
      failedReason: job.failedReason,
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await queue.close();
  }
}

run();
