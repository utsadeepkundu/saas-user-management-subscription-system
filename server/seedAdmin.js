import 'dotenv/config';

import mongoose from 'mongoose';
import User from './models/User.js';

const seedAdmin = async () => {
  const name = (process.env.ADMIN_NAME || 'System Administrator').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  if (!email) throw new Error('Set ADMIN_EMAIL before running npm run seed:admin.');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('ADMIN_PASSWORD must include uppercase, lowercase, and a number.');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    let admin = await User.findOne({ email });

    if (admin) {
      admin.name = name;
      admin.role = 'admin';
      admin.password = password;
      admin.isSuspended = false;
      admin.suspendedAt = null;
      admin.suspendReason = '';
      admin.subscription.plan = 'enterprise';
      admin.subscription.status = 'active';
      admin.subscription.startDate = new Date();
      admin.subscription.endDate = null;
      admin.subscription.features = User.getPlanFeatures('enterprise');
      await admin.save();
      console.log(`Admin account updated: ${email}`);
    } else {
      await User.create({
        name, email, password, role: 'admin',
        subscription: {
          plan: 'enterprise', status: 'active', startDate: new Date(),
          features: User.getPlanFeatures('enterprise'),
        },
      });
      console.log(`Admin account created: ${email}`);
    }
  } catch (error) {
    console.error('Failed to seed admin account:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

seedAdmin();
