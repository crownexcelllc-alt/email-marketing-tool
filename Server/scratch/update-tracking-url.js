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
    
    const liveTrackingUrl = 'https://apiemail.techsolutionor.com';

    const result = await db.collection('campaigns').updateOne(
      { _id: campaignId },
      { $set: { trackingBaseUrl: liveTrackingUrl } }
    );
    
    console.log('Update result:', result);
    
    const updatedCampaign = await db.collection('campaigns').findOne({ _id: campaignId });
    console.log('Updated trackingBaseUrl:', updatedCampaign.trackingBaseUrl);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
