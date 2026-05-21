const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI not found in .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const campaignSchema = new mongoose.Schema({}, { strict: false, collection: 'campaigns' });
  const Campaign = mongoose.model('Campaign', campaignSchema);

  const templateSchema = new mongoose.Schema({}, { strict: false, collection: 'templates' });
  const Template = mongoose.model('Template', templateSchema);

  const campaigns = await Campaign.find({}).lean().exec();
  console.log(`Found ${campaigns.length} campaigns:`);
  for (const c of campaigns) {
    console.log(`- Campaign: ${c.name} (id: ${c._id})`);
    console.log(`  templateId: ${c.templateId}`);
    if (c.templateId) {
      const t = await Template.findById(c.templateId).lean().exec();
      if (t) {
        console.log(`  Template found: name="${t.name}", type=${t.channelType || t.type}`);
        console.log(`  Template email:`, JSON.stringify(t.email));
        console.log(`  Template whatsapp:`, JSON.stringify(t.whatsapp));
      } else {
        console.log(`  Template NOT found for id ${c.templateId}`);
      }
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
