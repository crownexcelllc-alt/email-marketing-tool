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
  console.log(`Connecting to Redis: ${connection.host}:${connection.port}, db=${connection.db}, prefix=${prefix}`);
  
  const queue = new Queue(queueName, { connection, prefix });

  try {
    const jobTypes = ['waiting', 'active', 'delayed', 'failed', 'completed'];
    for (const type of jobTypes) {
      const count = await queue.getJobCountByTypes(type);
      console.log(`Queue "${queueName}" ${type} jobs count: ${count}`);
    }

    const jobs = await queue.getJobs(jobTypes);
    console.log(`Total retrieved jobs: ${jobs.length}`);
    for (const job of jobs) {
      console.log(`\n- Job ID: ${job.id}`);
      console.log(`  Name: ${job.name}`);
      console.log(`  Data:`, JSON.stringify(job.data));
      console.log(`  Opts:`, JSON.stringify(job.opts));
      console.log(`  State:`, await job.getState());
      console.log(`  FailedReason:`, job.failedReason);
      if (job.stacktrace && job.stacktrace.length > 0) {
        console.log(`  Stacktrace:`, job.stacktrace[0]);
      }
    }

    // Check email-send queue too
    const emailQueue = new Queue('email-send', { connection, prefix });
    console.log('\n--- Checking email-send queue ---');
    for (const type of jobTypes) {
      const count = await emailQueue.getJobCountByTypes(type);
      console.log(`Queue "email-send" ${type} jobs count: ${count}`);
    }
    const emailJobs = await emailQueue.getJobs(['waiting', 'active', 'delayed', 'failed']);
    console.log(`Total retrieved non-completed email jobs: ${emailJobs.length}`);
    for (const job of emailJobs.slice(0, 10)) {
      console.log(`\n- Email Job ID: ${job.id}`);
      console.log(`  Name: ${job.name}`);
      console.log(`  Data:`, JSON.stringify(job.data));
      console.log(`  Opts:`, JSON.stringify(job.opts));
      console.log(`  State:`, await job.getState());
      console.log(`  FailedReason:`, job.failedReason);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await queue.close();
  }
}

run();
