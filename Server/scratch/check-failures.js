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

    const campaign = await db.collection('campaigns').findOne({ _id: new mongoose.Types.ObjectId('6a11b32c877123c91412cdac') });
    if (!campaign) {
      console.log('Campaign not found!');
      return;
    }

    const recipients = await db.collection('campaign_recipients')
      .find({ campaignId: campaign._id, status: 'failed' })
      .project({ failureReason: 1 })
      .toArray();

    const patterns = {};
    for (const r of recipients) {
      let reason = r.failureReason || 'Unknown failure reason';
      let categorized = 'Other error';
      
      if (reason.includes('Daily user sending limit exceeded')) {
        categorized = 'Gmail Daily Sending Limit Exceeded (550-5.4.5)';
      } else if (reason.includes('550 5.1.1') || reason.includes('Recipient address rejected') || reason.includes('NoSuchUser')) {
        categorized = 'Recipient Address Rejected / Invalid Email (550 5.1.1)';
      } else {
        categorized = reason;
      }
      
      patterns[categorized] = (patterns[categorized] || 0) + 1;
    }

    console.log('\nAggregated Failure Reasons:');
    for (const [reason, count] of Object.entries(patterns)) {
      console.log(`- ${reason}: ${count} recipients`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
