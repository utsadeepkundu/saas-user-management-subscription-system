import { verifyAccessToken } from '../utils/helpers.js';
import User from '../models/User.js';

/** Verify the short-lived access token from an HttpOnly cookie or API bearer token. */
export const authenticate = async (req, res, next) => {
  try {
    let token;
    const authorization = req.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      token = authorization.slice(7).trim();
    } else {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. Sign in to continue.' });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded.id || decoded.type === 'refresh') {
      return res.status(401).json({ success: false, message: 'Not authorized. Invalid access token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found. Please sign in again.' });
    }
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'Account is suspended. Contact support.', reason: user.suspendReason });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    await user.applySubscriptionExpiry();
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Refreshing session may be required.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Not authorized. Invalid access token.' });
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
};

/** Enforce current subscription dates before endpoints that require any paid plan. */
export const requireActiveSubscription = async (req, res, next) => {
  try {
    await req.user.applySubscriptionExpiry();
    if (req.user.subscription.plan === 'free' || req.user.subscription.status === 'expired') {
      return res.status(403).json({
        success: false,
        message: 'An active paid subscription is required for this operation.',
        code: 'SUBSCRIPTION_REQUIRED',
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

/** Gate feature-specific endpoints using server-side plan capabilities. */
export const requireFeature = (feature) => async (req, res, next) => {
  try {
    await req.user.applySubscriptionExpiry();
    const value = req.user.subscription?.features?.[feature];
    if (value === undefined || value === null || value === false || value === 0) {
      return res.status(403).json({
        success: false,
        message: `This feature is not available on your current plan. Upgrade to unlock ${feature}.`,
        code: 'FEATURE_RESTRICTED',
        feature,
        currentPlan: req.user.subscription?.plan || 'free',
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};
