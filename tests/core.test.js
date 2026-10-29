import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../server/models/User.js';
import {
  PLAN_PRICING,
  assertRuntimeConfig,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../server/utils/helpers.js';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/unused_test_db';
process.env.JWT_SECRET = 'unit-test-access-secret-with-32-plus-characters';
process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret-with-32-characters';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

test('runtime config requires database URI and distinct JWT secrets', () => {
  assert.doesNotThrow(() => assertRuntimeConfig());
  const original = process.env.JWT_REFRESH_SECRET;
  process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;
  assert.throws(() => assertRuntimeConfig(), /must be different/);
  process.env.JWT_REFRESH_SECRET = original;
});

test('access and refresh JWTs use the expected token types and claims', () => {
  const access = generateAccessToken('unit-user-id');
  const refresh = generateRefreshToken('unit-user-id');
  assert.equal(verifyAccessToken(access).id, 'unit-user-id');
  assert.equal(verifyRefreshToken(refresh).id, 'unit-user-id');
  assert.equal(verifyRefreshToken(refresh).type, 'refresh');
});

test('plan price catalog and feature limits are internally consistent', () => {
  assert.equal(PLAN_PRICING.starter.monthly, 9.99);
  assert.equal(PLAN_PRICING.professional.monthly, 29.99);
  assert.equal(PLAN_PRICING.enterprise.yearly, 999.99);
  assert.equal(User.getPlanFeatures('free').maxProjects, 3);
  assert.equal(User.getPlanFeatures('starter').maxProjects, 10);
  assert.equal(User.getPlanFeatures('starter').analytics, false);
  assert.equal(User.getPlanFeatures('starter').customDomain, true);
  assert.equal(User.getPlanFeatures('professional').analytics, true);
  assert.equal(User.getPlanFeatures('enterprise').teamMembers, -1);
});

test('subscription expiry is detected from the end date', () => {
  const expiredUser = new User({
    name: 'Expired User',
    email: 'expired@example.com',
    password: 'A-Strong-Test-Password-1',
    subscription: {
      plan: 'starter',
      status: 'active',
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1),
      features: User.getPlanFeatures('starter'),
    },
  });
  assert.equal(expiredUser.isSubscriptionExpired(), true);
});
