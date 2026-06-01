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

    // Update sender accounts that have legacy limits
    const result = await db.collection('sender_accounts').updateMany(
      {
        channelType: 'email',
        $or: [
          { 'email.dailyLimit': { $in: [1000, 5000] } },
          { 'email.hourlyLimit': { $in: [100, 500] } },
          { 'email.minDelaySeconds': { $in: [1, 15, 20] } }
        ]
      },
      {
        $set: {
          'email.dailyLimit': 275,
          'email.hourlyLimit': 50,
          'email.minDelaySeconds': 50,
          'email.maxDelaySeconds': 80
        }
      }
    );
    console.log('Updated sender accounts documents:', result);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
