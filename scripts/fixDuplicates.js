const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({ path: path.join(__dirname, '../server/.env') });
const mongoose = require(path.join(__dirname, '../server/node_modules/mongoose'));

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.db.collection('studentmasters');
  const all = await col.find({}).toArray();

  // Long-key: registerNo is the university number (722824104141), rollNo is 24CS***
  const longRecs  = all.filter(r => !/^24CS\d+$/.test(r.registerNo) && r.rollNo && /^24CS\d+$/.test(r.rollNo));
  // Short-key: registerNo is already 24CS***
  const shortRecs = all.filter(r => /^24CS\d+$/.test(r.registerNo));

  console.log(`Total: ${all.length} | Long-key: ${longRecs.length} | Short-key: ${shortRecs.length}`);

  const shortMap = Object.fromEntries(shortRecs.map(r => [r.registerNo, r]));

  let merged = 0, renamed = 0;

  for (const rec of longRecs) {
    const rollKey = rec.rollNo;       // 24CS141
    const longKey = rec.registerNo;   // 722824104141

    // Build update payload — everything except _id, registerNo, __v, timestamps
    const { _id, registerNo, __v, createdAt, updatedAt, ...data } = rec;
    data.universityRegNo = longKey;

    if (shortMap[rollKey]) {
      // Merge imported data into the 24CS*** record, then delete the long-key duplicate
      await col.updateOne({ registerNo: rollKey }, { $set: data });
      await col.deleteOne({ registerNo: longKey });
      merged++;
    } else {
      // No 24CS*** record exists — just rename the key
      await col.updateOne({ _id: rec._id }, { $set: { registerNo: rollKey, universityRegNo: longKey } });
      renamed++;
    }
  }

  const finalCount = await col.countDocuments();
  console.log(`Done. Merged: ${merged} | Renamed: ${renamed} | Final count: ${finalCount}`);

  // Show a sample to verify
  const sample = await col.find({}, { registerNo: 1, rollNo: 1, universityRegNo: 1, name: 1, cgpa: 1, tenth: 1, placement: 1 }).limit(3).toArray();
  console.log('Sample:', JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
