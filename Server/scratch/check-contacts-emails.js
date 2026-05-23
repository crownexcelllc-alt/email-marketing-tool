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

    const workspaceId = '6a0ef1d2478e0af81d29da6f';
    const total = await db.collection('contacts').countDocuments({ workspaceId: new mongoose.Types.ObjectId(workspaceId) });
    console.log('Total contacts in workspace:', total);

    const withEmail = await db.collection('contacts').countDocuments({
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      email: { $ne: null, $exists: true, $not: /^\s*$/ }
    });
    console.log('Contacts with non-empty emails:', withEmail);

    const sample = await db.collection('contacts').find({ workspaceId: new mongoose.Types.ObjectId(workspaceId) }).limit(5).toArray();
    console.log('Sample contacts:', sample.map(c => ({ id: c._id, name: c.fullName, email: c.email, category: c.category })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
