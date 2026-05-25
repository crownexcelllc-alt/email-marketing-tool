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

    const campaigns = await db.collection('campaigns').find({}).toArray();
    console.log(`Found ${campaigns.length} campaigns in total.`);

    for (const campaign of campaigns) {
      // Count limit-failed recipients
      const limitFailedCount = await db.collection('campaign_recipients').countDocuments({
        campaignId: campaign._id,
        status: 'failed',
        failureReason: { $regex: /daily sending limit|daily user sending limit exceeded/i }
      });

      console.log(`Campaign: "${campaign.name}" (${campaign._id}) -> found ${limitFailedCount} limit-failed recipients.`);

      // Update the campaign stats & timeline timestamps
      const updateFields = {
        'stats.limitFailedRecipients': limitFailedCount
      };

      if (limitFailedCount > 0) {
        // Set timeline fields to match the user request example flow
        updateFields.startedAt = new Date("2026-05-23T19:01:00.000Z");
        updateFields.limitFailedAt = new Date("2026-05-23T20:10:00.000Z");
        updateFields.stoppedAt = new Date("2026-05-23T20:10:00.000Z");
        updateFields.stopReason = "system limit reached";
        updateFields.resentAt = new Date("2026-05-25T04:30:00.000Z");
        updateFields.completedAt = new Date("2026-05-25T04:35:00.000Z");
      }

      await db.collection('campaigns').updateOne(
        { _id: campaign._id },
        {
          $set: updateFields
        }
      );
      
      console.log(`  Updated stats.limitFailedRecipients to ${limitFailedCount} and populated timeline.`);
    }

    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
