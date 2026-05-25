const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const uri = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const campaigns = await db.collection('campaigns').find({}).toArray();
    for (const campaign of campaigns) {
      console.log(`\n--- Campaign: ${campaign.name} (${campaign._id}) ---`);
      console.log(`Status: ${campaign.status}`);
      console.log('Stats in Campaign Doc:', JSON.stringify(campaign.stats, null, 2));

      const totalRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId: campaign._id });
      const sentRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId: campaign._id, status: 'sent' });
      const failedRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId: campaign._id, status: 'failed' });
      const pendingRecipients = await db.collection('campaign_recipients').countDocuments({ campaignId: campaign._id, status: { $in: ['pending', 'queued', 'sending'] } });

      console.log(`Real DB Counts:`);
      console.log(`  Total: ${totalRecipients}`);
      console.log(`  Sent: ${sentRecipients}`);
      console.log(`  Failed: ${failedRecipients}`);
      console.log(`  Pending: ${pendingRecipients}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
