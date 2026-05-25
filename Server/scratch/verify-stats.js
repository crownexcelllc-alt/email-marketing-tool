const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const uri = process.env.MONGODB_URI;

const DAILY_LIMIT_FAILURE_PATTERN = /daily sending limit|daily user sending limit exceeded/i;

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const campaignIdStr = '6a11b32c877123c91412cdac';
    const campaignId = new mongoose.Types.ObjectId(campaignIdStr);

    const campaign = await db.collection('campaigns').findOne({ _id: campaignId });
    if (!campaign) {
      console.log('Campaign not found!');
      return;
    }

    const [
      sentRecipients,
      failedRecipients,
      skippedRecipients,
      limitFailedRecipients,
      openCount,
      uniqueOpenCount,
      clickCount,
      uniqueClickCount,
    ] = await Promise.all([
      db.collection('campaign_recipients').countDocuments({
        campaignId,
        status: 'sent',
      }),
      db.collection('campaign_recipients').countDocuments({
        campaignId,
        status: 'failed',
      }),
      db.collection('campaign_recipients').countDocuments({
        campaignId,
        status: 'skipped',
      }),
      db.collection('campaign_recipients').countDocuments({
        campaignId,
        status: 'failed',
        failureReason: { $regex: DAILY_LIMIT_FAILURE_PATTERN },
      }),
      db.collection('contact_activities').countDocuments({
        campaignId,
        eventType: 'open',
      }),
      db.collection('contact_activities').distinct('contactId', {
        campaignId,
        eventType: 'open',
      }).then((res) => res.length),
      db.collection('contact_activities').countDocuments({
        campaignId,
        eventType: 'click',
      }),
      db.collection('contact_activities').distinct('contactId', {
        campaignId,
        eventType: 'click',
      }).then((res) => res.length),
    ]);

    const totalRecipients = campaign.stats?.totalRecipients || campaign.contactIds.length || 0;
    const computedRemaining = Math.max(0, totalRecipients - sentRecipients);

    console.log('Computed Campaign response stats:');
    console.log({
      totalRecipients,
      queuedRecipients: computedRemaining,
      skippedRecipients,
      sentRecipients,
      failedRecipients,
      limitFailedRecipients,
      openCount,
      uniqueOpenCount,
      clickCount,
      uniqueClickCount,
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
