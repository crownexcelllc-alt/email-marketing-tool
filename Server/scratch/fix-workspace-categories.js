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
    const workspace = await db.collection('workspaces').findOne({ _id: new mongoose.Types.ObjectId(workspaceId) });
    if (workspace) {
      console.log('Original Categories:', workspace.categories);
      // Replace 'eid special' with 'Eid Special'
      const updatedCategories = (workspace.categories || []).map(cat => cat === 'eid special' ? 'Eid Special' : cat);
      // Remove any duplicate if exists
      const uniqueCategories = Array.from(new Set(updatedCategories));
      
      await db.collection('workspaces').updateOne(
        { _id: new mongoose.Types.ObjectId(workspaceId) },
        { $set: { categories: uniqueCategories } }
      );
      console.log('Updated Workspace Categories to:', uniqueCategories);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
