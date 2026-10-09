/**
 * Provision student accounts for the approved class roster.
 * Run: node scripts/seedStudents.js
 * Requires MONGODB_URI and STUDENT_INITIAL_PASSWORD in server/.env
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  const uri = process.env.MONGODB_URI;
  const initialPassword = process.env.STUDENT_INITIAL_PASSWORD;

  if (!uri) { console.error('MONGODB_URI not set in server/.env'); process.exit(1); }
  if (!initialPassword) { console.error('STUDENT_INITIAL_PASSWORD not set in server/.env'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Require models after connection
  const User = require('../server/src/models/User');
  const StudentMaster = require('../server/src/models/StudentMaster');
  const { ROSTER } = require('../server/src/config/roster');

  const passwordHash = await bcrypt.hash(initialPassword, 12);
  let created = 0, skipped = 0;

  for (const registerNo of ROSTER) {
    const existing = await User.findOne({ registerNo });
    if (existing) { skipped++; continue; }

    await User.create({
      role: 'student',
      registerNo,
      passwordHash,
      isActive: true,
      mustChangePassword: true,
    });
    await StudentMaster.findOneAndUpdate(
      { registerNo },
      { $setOnInsert: { registerNo, dept: 'CSE', year: 'III' } },
      { upsert: true }
    );
    created++;
  }

  console.log(`Done: ${created} student accounts created, ${skipped} already existed`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err.message); process.exit(1); });
