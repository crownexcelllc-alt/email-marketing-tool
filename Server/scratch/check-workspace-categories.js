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

    // Fetch workspace
    const workspaceId = '6a0ef1d2478e0af81d29da6f';
    const workspace = await db.collection('workspaces').findOne({ _id: new mongoose.Types.ObjectId(workspaceId) });
    console.log('Workspace Name:', workspace?.name);
    console.log('Workspace Categories:', workspace?.categories);

    // Fetch distinct contact categories
    const distinctCategories = await db.collection('contacts').distinct('category', { workspaceId: new mongoose.Types.ObjectId(workspaceId) });
    console.log('Distinct Categories in Contacts:', distinctCategories);

    // Let's also see some contacts count by category
    const counts = await db.collection('contacts').aggregate([
      { $match: { workspaceId: new mongoose.Types.ObjectId(workspaceId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]).toArray();
    console.log('Contacts counts by category:', counts);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
