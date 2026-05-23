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

    const all = await db.collection('sender_accounts').find({}).toArray();
    for (const acc of all) {
      console.log(`- ID: ${acc._id}, Name: ${acc.name}, ChannelType: ${acc.channelType}`);
      console.log(`  email:`, JSON.stringify(acc.email, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
