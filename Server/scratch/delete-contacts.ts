import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load .env configuration
dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1);
}

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri!);
    console.log('Connected successfully.');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is not established.');
    }

    console.log('Deleting all documents in "contacts" collection...');
    const result = await db.collection('contacts').deleteMany({});
    console.log(`Deleted ${result.deletedCount} contacts successfully.`);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
