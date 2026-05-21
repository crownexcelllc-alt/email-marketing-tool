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
    
    const collection = db.collection('sender_accounts');
    
    // Find specific sender account
    const id = '6a0ef45f478e0af81d29daad';
    console.log('Querying sender account:', id);
    const account = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
    console.log('Sender Account:', JSON.stringify(account, null, 2));

    // Also list all other sender accounts email configuration and secure status
    console.log('All sender accounts:');
    const all = await collection.find({}).toArray();
    for (const acc of all) {
      console.log(`- ID: ${acc._id}, Name: ${acc.name}, ChannelType: ${acc.channelType}`);
      if (acc.email) {
        console.log(`  Email: ${acc.email.email}, Host: ${acc.email.smtpHost}, Port: ${acc.email.smtpPort}, Secure: ${acc.email.secure}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
