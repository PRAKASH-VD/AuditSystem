const bcrypt = require('bcryptjs');
const { connectDb } = require('../config/db');
const { env } = require('../config/env');
const User = require('../models/User');

async function seed() {
  await connectDb();
  const name = process.env.SEED_ADMIN_NAME || 'Admin';
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ name, email, role: 'admin', passwordHash });
  console.log('Admin created');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Failed to seed admin', err);
  process.exit(1);
});
