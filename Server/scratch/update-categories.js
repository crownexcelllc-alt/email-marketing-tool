const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  const db = mongoose.connection.db;
  
  // Find all workspaces
  const workspaces = await db.collection('workspaces').find().toArray();
  console.log("Workspaces found:", workspaces.map(w => ({ id: w._id, name: w.name })));

  for (const workspace of workspaces) {
    const count = await db.collection('contacts').countDocuments({ workspaceId: workspace._id });
    console.log(`Workspace ${workspace.name || 'Unnamed'} (${workspace._id}) has ${count} contacts.`);
    
    if (count > 0) {
      console.log(`Updating ${count} contacts in workspace ${workspace.name || 'Unnamed'} to category "Eid Special"...`);
      const res = await db.collection('contacts').updateMany(
        { workspaceId: workspace._id },
        { $set: { category: 'Eid Special' } }
      );
      console.log(`Updated ${res.modifiedCount} contacts.`);
      
      // Ensure "eid special" normalized is added to the workspace categories list
      await db.collection('workspaces').updateOne(
        { _id: workspace._id },
        { $addToSet: { categories: 'eid special' } }
      );
      console.log(`Added "eid special" category to workspace.`);
    }
  }

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
