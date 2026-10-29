import User from '../models/User.js';
import { PLAN_PRICING, generateInvoiceId } from '../utils/helpers.js';

/**
 * @desc    Get current subscription details
 * @route   GET /api/subscription
 * @access  Private
 */
export const getSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const expiryApplied = await user.applySubscriptionExpiry();
    const isExpired = expiryApplied || user.subscription.status === 'expired';

    res.status(200).json({
      success: true,
      data: {
        subscription: user.subscription,
        isExpired,
        availablePlans: PLAN_PRICING,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching subscription.',
    });
  }
};

/**
 * @desc    Upgrade subscription plan
 * @route   POST /api/subscription/upgrade
 * @access  Private
 */
export const upgradePlan = async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly' } = req.body;
    const validPlans = ['starter', 'professional', 'enterprise'];

    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan. Choose from: ${validPlans.join(', ')}`,
      });
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return res.status(400).json({ success: false, message: 'billingCycle must be monthly or yearly.' });
    }

    // Paid plan upgrades are simulations until a payment provider/webhook is integrated.
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SIMULATED_BILLING !== 'true') {
      return res.status(503).json({
        success: false,
        code: 'PAYMENTS_NOT_CONFIGURED',
        message: 'Paid upgrades are disabled until a payment provider is configured.',
      });
    }

    const user = await User.findById(req.user._id);
    await user.applySubscriptionExpiry();

    // Determine plan hierarchy for upgrade validation
    const planHierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };
    const currentPlanLevel = planHierarchy[user.subscription.plan];
    const newPlanLevel = planHierarchy[plan];

    if (newPlanLevel <= currentPlanLevel) {
      return res.status(400).json({
        success: false,
        message: 'You can only upgrade to a higher plan. Use downgrade endpoint for lower plans.',
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Get plan features
    const features = User.getPlanFeatures(plan);
    const pricing = PLAN_PRICING[plan];
    const amount = billingCycle === 'yearly' ? pricing.yearly : pricing.monthly;

    // Create billing record
    const billingRecord = {
      amount,
      currency: 'USD',
      date: new Date(),
      description: `${pricing.name} Plan - ${billingCycle} subscription`,
      invoiceId: generateInvoiceId(),
      status: 'simulated',
      paymentProvider: 'none',
    };

    // Update subscription
    user.subscription = {
      plan,
      status: 'active',
      startDate,
      endDate,
      features,
      billingHistory: [...(user.subscription.billingHistory || []), billingRecord],
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${pricing.name} plan.`,
      data: {
        subscription: user.subscription,
        invoice: billingRecord,
      },
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during plan upgrade.',
    });
  }
};

/**
 * @desc    Downgrade subscription plan
 * @route   POST /api/subscription/downgrade
 * @access  Private
 */
export const downgradePlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['free', 'starter', 'professional'];

    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan. Choose from: ${validPlans.join(', ')}`,
      });
    }

    const user = await User.findById(req.user._id);
    await user.applySubscriptionExpiry();
    const planHierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };

    if (planHierarchy[plan] >= planHierarchy[user.subscription.plan]) {
      return res.status(400).json({
        success: false,
        message: 'You can only downgrade to a lower plan.',
      });
    }

    const features = User.getPlanFeatures(plan);
    const startDate = new Date();
    let endDate = null;

    if (plan !== 'free') {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
    }

    user.subscription = {
      plan,
      status: 'active',
      startDate,
      endDate,
      features,
      billingHistory: user.subscription.billingHistory || [],
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: `Successfully downgraded to ${plan} plan.`,
      data: {
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during plan downgrade.',
    });
  }
};

/**
 * @desc    Cancel subscription (revert to free)
 * @route   POST /api/subscription/cancel
 * @access  Private
 */
export const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.applySubscriptionExpiry();

    if (user.subscription.plan === 'free') {
      return res.status(400).json({
        success: false,
        message: 'You are already on the free plan.',
      });
    }

    const features = User.getPlanFeatures('free');

    user.subscription = {
      plan: 'free',
      status: 'cancelled',
      startDate: new Date(),
      endDate: null,
      features,
      billingHistory: user.subscription.billingHistory || [],
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled. Reverted to free plan.',
      data: {
        subscription: user.subscription,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error cancelling subscription.',
    });
  }
};

/**
 * @desc    Get billing history
 * @route   GET /api/subscription/billing
 * @access  Private
 */
export const getBillingHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.applySubscriptionExpiry();

    res.status(200).json({
      success: true,
      data: {
        billingHistory: user.subscription.billingHistory || [],
        currentPlan: user.subscription.plan,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching billing history.',
    });
  }
};

/**
 * @desc    Get available plans
 * @route   GET /api/subscription/plans
 * @access  Public
 */
export const getPlans = async (req, res) => {
  try {
    const plans = Object.entries(PLAN_PRICING).map(([key, value]) => ({
      id: key,
      ...value,
      features: User.getPlanFeatures(key),
    }));

    res.status(200).json({
      success: true,
      data: { plans },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching plans.',
    });
  }
};
