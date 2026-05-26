const mongoose = require('mongoose');
const { Queue } = require('bullmq');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
};
const prefix = process.env.BULLMQ_PREFIX || 'marketing-platform';

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;

    const campaignId = new mongoose.Types.ObjectId('6a11b32c877123c91412cdac');
    const workspaceId = new mongoose.Types.ObjectId('6a0ef1d2478e0af81d29da6f');

    // 1. Update the campaign status and limit fields
    console.log('Updating campaign in DB...');
    const campaignUpdate = await db.collection('campaigns').updateOne(
      { _id: campaignId },
      {
        $set: {
          status: 'running',
          stoppedAt: null,
          stopReason: null,
          limitFailedAt: null,
          limitResumeAt: null,
          'stats.limitFailedRecipients': 0,
        }
      }
    );
    console.log('Campaign updated:', campaignUpdate);

    // 2. Update recipients from queued/sending to pending
    console.log('Updating recipients in DB...');
    const recipientUpdate = await db.collection('campaign_recipients').updateMany(
      {
        campaignId,
        status: { $in: ['queued', 'sending'] }
      },
      {
        $set: {
          status: 'pending'
        }
      }
    );
    console.log('Recipients updated:', recipientUpdate);

    // 3. Connect to BullMQ and enqueue the scheduler tick
    console.log('Enqueuing scheduler tick in BullMQ...');
    const queue = new Queue('campaign-scheduler', { connection, prefix });
    
    // We add the job without a custom jobId to avoid duplicate ID issues,
    // or we can remove the previous completed limit-resume job first.
    // Let's first clean up the completed job if it exists.
    try {
      const existingJob = await queue.getJob(`campaign-limit-resume-${campaignId.toString()}`);
      if (existingJob) {
        console.log(`Found existing job ${existingJob.id} in state ${await existingJob.getState()}. Removing it...`);
        await existingJob.remove();
        console.log('Job removed.');
      }
    } catch (err) {
      console.log('Error checking/removing existing job:', err.message);
    }

    const job = await queue.add(
      'campaign-scheduler.tick',
      {
        campaignId: campaignId.toString(),
        workspaceId: workspaceId.toString(),
      },
      {
        attempts: 5,
        removeOnFail: 5000,
        removeOnComplete: 1000,
      }
    );
    console.log(`Job enqueued successfully! Job ID: ${job.id}`);
    
    await queue.close();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
