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

  const contactSchema = new mongoose.Schema({}, { strict: false, collection: 'contacts' });
  const Contact = mongoose.model('Contact', contactSchema);

  const sample = await Contact.find({}).limit(10).lean().exec();

  console.log('Sample contacts:', JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
