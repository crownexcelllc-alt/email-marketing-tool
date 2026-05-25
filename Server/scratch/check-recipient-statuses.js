const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const uri = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected');
    const db = mongoose.connection.db;

    const pipeline = [
      { $match: { campaignId: new mongoose.Types.ObjectId('6a11b32c877123c91412cdac') } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ];

    const result = await db.collection('campaign_recipients').aggregate(pipeline).toArray();
    console.log('Recipient status counts:', result);

    const firstFailed = await db.collection('campaign_recipients').findOne({
      campaignId: new mongoose.Types.ObjectId('6a11b32c877123c91412cdac'),
      status: 'failed'
    });
    console.log('First failed recipient:', firstFailed);

    const firstPending = await db.collection('campaign_recipients').findOne({
      campaignId: new mongoose.Types.ObjectId('6a11b32c877123c91412cdac'),
      status: 'pending'
    });
    console.log('First pending recipient:', firstPending);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
