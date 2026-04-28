const bcrypt = require('bcryptjs');
const User   = require('./models/User');

const SEED_USERS = [
  { username: 'alice',   email: 'alice@company.com',   password: 'Alice@123',   role: 'admin' },
  { username: 'bob',     email: 'bob@company.com',     password: 'Bob@123',     role: 'employee' },
  { username: 'charlie', email: 'charlie@company.com', password: 'Charlie@123', role: 'employee' }
];

async function autoSeed() {
  try {
    const count = await User.countDocuments();
    if (count > 0) return; // already seeded

    for (const u of SEED_USERS) {
      const hashed = await bcrypt.hash(u.password, 12);
      await User.create({ ...u, password: hashed });
    }
    console.log('Auto-seed complete: alice, bob, charlie created');
  } catch (err) {
    console.error('Auto-seed error:', err.message);
  }
}

module.exports = autoSeed;
