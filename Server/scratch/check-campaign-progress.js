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
    const db = mongoose.connection.db;

    const campaignId = new mongoose.Types.ObjectId('6a11b32c877123c91412cdac');
    const campaign = await db.collection('campaigns').findOne({ _id: campaignId });
    
    console.log(`=== Campaign: ${campaign.name} ===`);
    console.log(`Status: ${campaign.status}`);
    console.log(`Stop Reason: ${campaign.stopReason}`);
    console.log(`Limit Resume At: ${campaign.limitResumeAt}`);
    console.log(`Stats:`, JSON.stringify(campaign.stats, null, 2));

    const totalRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId });
    const sentRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId, status: 'sent' });
    const failedRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId, status: 'failed' });
    const pendingRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId, status: 'pending' });
    const queuedRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId, status: 'queued' });
    const sendingRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId, status: 'sending' });

    console.log(`\nReal DB Counts:`);
    console.log(`  Total: ${totalRecipients}`);
    console.log(`  Sent: ${sentRecipients}`);
    console.log(`  Failed: ${failedRecipients}`);
    console.log(`  Pending: ${pendingRecipients}`);
    console.log(`  Queued: ${queuedRecipients}`);
    console.log(`  Sending: ${sendingRecipients}`);

    // Check queue status
    console.log('\n=== Queue status ===');
    const queue = new Queue('campaign-scheduler', { connection, prefix });
    const jobTypes = ['waiting', 'active', 'delayed', 'failed', 'completed'];
    for (const type of jobTypes) {
      const count = await queue.getJobCountByTypes(type);
      console.log(`Queue "campaign-scheduler" ${type} jobs count: ${count}`);
    }

    const emailQueue = new Queue('email-send', { connection, prefix });
    for (const type of jobTypes) {
      const count = await emailQueue.getJobCountByTypes(type);
      console.log(`Queue "email-send" ${type} jobs count: ${count}`);
    }

    await queue.close();
    await emailQueue.close();
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
