import User from '../models/User.js';
import crypto from 'node:crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken } from '../utils/helpers.js';
import { isEmailDeliveryConfigured, sendPasswordResetEmail } from '../utils/email.js';

const accessCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 15 * 60 * 1000,
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, accessCookieOptions());
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', accessCookieOptions());
  res.clearCookie('refreshToken', refreshCookieOptions());
};

const toPublicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isActive: user.isActive,
  isSuspended: user.isSuspended,
  subscription: user.subscription,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const issueSession = async (user, res) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  // Keep only a one-way hash of the refresh token in the database.
  user.refreshToken = hashToken(refreshToken);
  user.lastLogin = new Date();
  await user.save();
  setAuthCookies(res, accessToken, refreshToken);
};

/** POST /api/auth/register */
export const register = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      subscription: {
        plan: 'free',
        status: 'active',
        startDate: new Date(),
        features: User.getPlanFeatures('free'),
      },
    });

    await issueSession(user, res);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user: toPublicUser(user) },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    console.error('Register error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/** POST /api/auth/login */
export const login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account is suspended. Contact support.', reason: user.suspendReason });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    await user.applySubscriptionExpiry();
    await issueSession(user, res);
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: { user: toPublicUser(user) },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/** POST /api/auth/refresh — refresh tokens are accepted only from HttpOnly cookies. */
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh session is required.' });
    }

    const decoded = verifyRefreshToken(token);
    if (decoded.type !== 'refresh' || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Invalid refresh session.' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== hashToken(token) || user.isSuspended || !user.isActive) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: 'Invalid refresh session.' });
    }

    await user.applySubscriptionExpiry();
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();
    setAuthCookies(res, accessToken, newRefreshToken);

    return res.status(200).json({ success: true, message: 'Session refreshed.' });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh session.' });
  }
};

/** POST /api/auth/logout */
export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { refreshToken: null } });
    clearAuthCookies(res);
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error.message);
    clearAuthCookies(res);
    return res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
};

/** POST /api/auth/forgot-password */
export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const emailConfigured = isEmailDeliveryConfigured();

    if (process.env.NODE_ENV === 'production' && !emailConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Password reset email is not configured. Please contact the site administrator.',
      });
    }

    const user = await User.findOne({ email });
    // Do not disclose whether an account exists.
    if (!user) {
      return res.status(200).json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const baseUrl = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    if (emailConfigured) {
      await sendPasswordResetEmail({ email: user.email, resetUrl });
    }

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
      ...(!emailConfigured && process.env.NODE_ENV !== 'production' ? { data: { resetUrl } } : {}),
    });
  } catch (error) {
    console.error('Forgot-password error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not process the password reset request.' });
  }
};

/** POST /api/auth/reset-password/:token */
export const resetPassword = async (req, res) => {
  try {
    const tokenHash = hashToken(req.params.token);
    const user = await User.findOne({
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link.' });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = undefined;
    await user.save();
    clearAuthCookies(res);

    return res.status(200).json({ success: true, message: 'Password reset successful. Please sign in with your new password.' });
  } catch (error) {
    console.error('Reset-password error:', error.message);
    return res.status(500).json({ success: false, message: 'Could not reset the password.' });
  }
};

/** GET /api/auth/me */
export const getMe = async (req, res) => {
  try {
    await req.user.applySubscriptionExpiry();
    return res.status(200).json({ success: true, data: { user: toPublicUser(req.user) } });
  } catch (error) {
    console.error('Get-me error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching user data.' });
  }
};

