import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const assertRuntimeConfig = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
  }

  if (process.env.NODE_ENV === 'production') {
    const insecure = ['JWT_SECRET', 'JWT_REFRESH_SECRET'].filter((key) => {
      const value = process.env[key] || '';
      return value.length < 32 || /replace_with|change_me|your_.*secret|dev_jwt/i.test(value);
    });
    if (insecure.length) {
      throw new Error(`Use unique random secrets of at least 32 characters for: ${insecure.join(', ')}`);
    }
  }
};

const secretFor = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required.`);
  return value;
};

export const generateAccessToken = (userId) => jwt.sign(
  { id: String(userId) }, secretFor('JWT_SECRET'),
  { expiresIn: process.env.JWT_EXPIRES_IN || '15m', issuer: 'saasflow-api', audience: 'saasflow-client' }
);

export const generateRefreshToken = (userId) => jwt.sign(
  { id: String(userId), type: 'refresh' }, secretFor('JWT_REFRESH_SECRET'),
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', issuer: 'saasflow-api', audience: 'saasflow-client' }
);

export const verifyAccessToken = (token) => jwt.verify(token, secretFor('JWT_SECRET'), { issuer: 'saasflow-api', audience: 'saasflow-client' });
export const verifyRefreshToken = (token) => jwt.verify(token, secretFor('JWT_REFRESH_SECRET'), { issuer: 'saasflow-api', audience: 'saasflow-client' });
export const generateResetToken = () => crypto.randomBytes(32).toString('hex');
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const PLAN_PRICING = Object.freeze({
  free: { monthly: 0, yearly: 0, name: 'Free' },
  starter: { monthly: 9.99, yearly: 99.99, name: 'Starter' },
  professional: { monthly: 29.99, yearly: 299.99, name: 'Professional' },
  enterprise: { monthly: 99.99, yearly: 999.99, name: 'Enterprise' },
});

export const generateInvoiceId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `INV-${timestamp}-${random}`;
};
