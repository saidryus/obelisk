/**
 * Seed script — creates demo users.
 * Run once: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');

const users = [
  { username: 'alice',   email: 'alice@company.com',   password: 'Alice@123',   role: 'admin' },
  { username: 'bob',     email: 'bob@company.com',     password: 'Bob@123',     role: 'employee' },
  { username: 'charlie', email: 'charlie@company.com', password: 'Charlie@123', role: 'employee' }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({}); // clear existing users

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 12);
    await User.create({ ...u, password: hashed });
    console.log(`Created user: ${u.username} (${u.role})`);
  }

  console.log('\nDemo credentials:');
  users.forEach(u => console.log(`  ${u.username} / ${u.password}`));

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => { console.error(err); process.exit(1); });
