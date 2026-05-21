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

  const recipientSchema = new mongoose.Schema({
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }
  }, { strict: false, collection: 'campaign_recipients' });
  const CampaignRecipient = mongoose.model('CampaignRecipient', recipientSchema);

  const contactSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    fullName: String,
    email: String
  }, { strict: false, collection: 'contacts' });
  const Contact = mongoose.model('Contact', contactSchema);

  const campaign = await Campaign.findOne({ name: 'Testing Final Inshallah' }).lean().exec();
  if (!campaign) {
    console.log('Campaign not found!');
    await mongoose.disconnect();
    return;
  }

  console.log('Campaign found:', campaign._id, campaign.name);

  const recipients = await CampaignRecipient.find({ campaignId: campaign._id })
    .populate('contactId')
    .limit(10)
    .lean()
    .exec();

  console.log('Recipients with populated contacts:');
  recipients.forEach(r => {
    console.log({
      recipientAddress: r.address,
      contactId: r.contactId ? r.contactId._id : null,
      firstName: r.contactId ? r.contactId.firstName : undefined,
      lastName: r.contactId ? r.contactId.lastName : undefined,
      fullName: r.contactId ? r.contactId.fullName : undefined,
      email: r.contactId ? r.contactId.email : undefined,
    });
  });

  await mongoose.disconnect();
}

run().catch(console.error);
