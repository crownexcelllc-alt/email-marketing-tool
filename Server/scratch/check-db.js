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

    const sample = await db.collection('campaign_recipients').findOne({});
    console.log('Sample recipient:', sample);

    const count = await db.collection('campaign_recipients').countDocuments({ campaignId: new mongoose.Types.ObjectId('6a11b32c877123c91412cdac') });
    console.log('Count with ObjectId campaignId:', count);

    const countStr = await db.collection('campaign_recipients').countDocuments({ campaignId: '6a11b32c877123c91412cdac' });
    console.log('Count with String campaignId:', countStr);

    const campaign = await db.collection('campaigns').findOne({ _id: new mongoose.Types.ObjectId('6a11b32c877123c91412cdac') });
    console.log('Campaign:', campaign);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
