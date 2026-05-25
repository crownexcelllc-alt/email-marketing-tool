const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const uri = process.env.MONGODB_URI;

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const campaign = await db.collection('campaigns').findOne({ _id: new mongoose.Types.ObjectId('6a11b32c877123c91412cdac') });
    console.log('Campaign:');
    console.log('  segmentId:', campaign.segmentId);
    console.log('  contactIds count:', campaign.contactIds ? campaign.contactIds.length : 0);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
