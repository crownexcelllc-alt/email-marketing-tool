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
    
    const events = await db.collection('send_events')
      .find({ campaignId, eventType: { $in: ['send_failed_temporary', 'send_failed_permanent'] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    console.log(`Found ${events.length} failed send events:`);
    for (const ev of events) {
      console.log(`\n- Event ID: ${ev._id}`);
      console.log(`  Time: ${ev.createdAt.toISOString()}`);
      console.log(`  Type: ${ev.eventType}`);
      console.log(`  Code: ${ev.failureCode}`);
      console.log(`  Message: ${ev.failureMessage}`);
      console.log(`  SMTP Code: ${ev.smtpResponseCode}`);
      console.log(`  Recipient: ${ev.address}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
