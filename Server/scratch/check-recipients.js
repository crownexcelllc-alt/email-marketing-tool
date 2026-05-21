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

  const recipientSchema = new mongoose.Schema({
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }
  }, { strict: false, collection: 'campaign_recipients' });
  const CampaignRecipient = mongoose.model('CampaignRecipient', recipientSchema);

  const contactSchema = new mongoose.Schema({}, { strict: false, collection: 'contacts' });
  const Contact = mongoose.model('Contact', contactSchema);

  const sample = await CampaignRecipient.find({})
    .populate({ path: 'contactId', model: Contact })
    .limit(5)
    .lean()
    .exec();

  console.log('Sample recipients:', JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
