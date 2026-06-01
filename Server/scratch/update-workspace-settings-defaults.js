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

    // We will update all workspace settings sending limits that have the legacy defaults (5000, 500, 15, 30)
    // or just update all workspace settings sending limits to the new optimized defaults
    const result = await db.collection('workspace_settings').updateMany(
      {},
      {
        $set: {
          'sendingLimits.dailyLimit': 275,
          'sendingLimits.hourlyLimit': 50,
          'sendingLimits.minDelaySeconds': 50,
          'sendingLimits.maxDelaySeconds': 80
        }
      }
    );
    console.log('Updated workspace settings documents:', result);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
