const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const uri = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;

    const campaignId = new mongoose.Types.ObjectId('6a11b32c877123c91412cdac');

    // 1. Reset all 'queued' recipients back to 'pending'
    const recipientUpdate = await db.collection('campaign_recipients').updateMany(
      {
        campaignId,
        status: 'queued'
      },
      {
        $set: {
          status: 'pending',
          failedAt: null,
          failureReason: ''
        }
      }
    );
    console.log(`Updated ${recipientUpdate.modifiedCount} recipients from 'queued' to 'pending'`);

    // 2. Count remaining pending recipients
    const remainingCount = await db.collection('campaign_recipients').countDocuments({
      campaignId,
      status: 'pending'
    });
    console.log(`Remaining pending recipients: ${remainingCount}`);

    // 3. Set campaign status to paused due to daily limit, and set limitFailedAt / limitResumeAt
    const now = new Date();
    const resumeAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    const campaignUpdate = await db.collection('campaigns').updateOne(
      { _id: campaignId },
      {
        $set: {
          status: 'paused',
          stopReason: 'daily sending limit reached',
          limitFailedAt: now,
          limitResumeAt: resumeAt,
          completedAt: null,
          'stats.queuedRecipients': remainingCount,
          'stats.limitFailedRecipients': remainingCount,
          'stats.failedRecipients': 0
        }
      }
    );
    console.log('Campaign updated:', campaignUpdate);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
