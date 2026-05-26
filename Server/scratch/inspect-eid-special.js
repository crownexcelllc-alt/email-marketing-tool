const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const uri = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const campaignId = new mongoose.Types.ObjectId('6a11b32c877123c91412cdac');
    const campaign = await db.collection('campaigns').findOne({ _id: campaignId });
    console.log('CAMPAIGN DOCUMENT:');
    console.log(JSON.stringify(campaign, null, 2));

    // Also get the sender accounts details
    if (campaign && campaign.senderAccountIds && campaign.senderAccountIds.length > 0) {
      console.log('\nSENDER ACCOUNTS:');
      for (const senderId of campaign.senderAccountIds) {
        const sender = await db.collection('sender_accounts').findOne({ _id: senderId });
        console.log(JSON.stringify(sender, null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
