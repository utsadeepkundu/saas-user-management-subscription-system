import User from '../models/User.js';
import { PLAN_PRICING } from '../utils/helpers.js';

/**
 * @desc    Get all users (paginated)
 * @route   GET /api/admin/users
 * @access  Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const planFilter = req.query.plan || '';
    const statusFilter = req.query.status || '';
    const allowedSortFields = new Set(['createdAt', 'updatedAt', 'name', 'email', 'lastLogin']);
    const sortBy = allowedSortFields.has(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query = {};

    if (search) {
      const safeSearch = String(search).slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (planFilter) {
      query['subscription.plan'] = planFilter;
    }

    if (statusFilter === 'suspended') {
      query.isSuspended = true;
    } else if (statusFilter === 'active') {
      query.isActive = true;
      query.isSuspended = false;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    // Aggregate stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true, isSuspended: false });
    const suspendedUsers = await User.countDocuments({ isSuspended: true });
    const paidUsers = await User.countDocuments({
      'subscription.plan': { $ne: 'free' },
      'subscription.status': 'active',
      $or: [
        { 'subscription.endDate': { $gt: new Date() } },
        { 'subscription.endDate': null },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit,
        },
        stats: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          paidUsers,
          freeUsers: totalUsers - paidUsers,
        },
      },
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users.',
    });
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/admin/users/:id
 * @access  Admin
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching user.',
    });
  }
};

/**
 * @desc    Change user's subscription plan (admin override)
 * @route   PUT /api/admin/users/:id/plan
 * @access  Admin
 */
export const changeUserPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const validPlans = ['free', 'starter', 'professional', 'enterprise'];

    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: `Invalid plan. Choose from: ${validPlans.join(', ')}`,
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const features = User.getPlanFeatures(plan);
    const startDate = new Date();
    let endDate = null;

    if (plan !== 'free') {
      endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // Admin grants 1 year
    }

    user.subscription = {
      plan,
      status: 'active',
      startDate,
      endDate,
      features,
      billingHistory: [
        ...(user.subscription.billingHistory || []),
        {
          amount: 0,
          currency: 'USD',
          date: new Date(),
          description: `Admin plan change to ${plan}`,
          invoiceId: `ADMIN-${Date.now()}`,
          status: 'admin-grant',
          paymentProvider: 'none',
        },
      ],
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: `User plan changed to ${plan}.`,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error changing user plan.',
    });
  }
};

/**
 * @desc    Suspend a user account
 * @route   PUT /api/admin/users/:id/suspend
 * @access  Admin
 */
export const suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot suspend an admin account.',
      });
    }

    user.isSuspended = true;
    user.suspendedAt = new Date();
    user.suspendReason = reason || 'Suspended by admin';
    user.refreshToken = undefined; // Force re-login
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User account suspended.',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error suspending user.',
    });
  }
};

/**
 * @desc    Reactivate a suspended user
 * @route   PUT /api/admin/users/:id/reactivate
 * @access  Admin
 */
export const reactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    user.isSuspended = false;
    user.suspendedAt = null;
    user.suspendReason = '';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User account reactivated.',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error reactivating user.',
    });
  }
};

/**
 * @desc    Delete a user (admin)
 * @route   DELETE /api/admin/users/:id
 * @access  Admin
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an admin account.',
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting user.',
    });
  }
};

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/admin/stats
 * @access  Admin
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true, isSuspended: false });
    const suspendedUsers = await User.countDocuments({ isSuspended: true });
    const activeSubscriptions = await User.countDocuments({
      'subscription.plan': { $ne: 'free' },
      'subscription.status': 'active',
      $or: [
        { 'subscription.endDate': { $gt: new Date() } },
        { 'subscription.endDate': null },
      ],
    });

    // Subscription breakdown
    const planBreakdown = await User.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } },
    ]);

    // Revenue estimate (from billing history)
    const revenueData = await User.aggregate([
      { $unwind: '$subscription.billingHistory' },
      { $match: { 'subscription.billingHistory.status': 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$subscription.billingHistory.amount' },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Daily signups for chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailySignups = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          suspendedUsers,
          activeSubscriptions,
          paidUsers: activeSubscriptions,
          recentSignups,
          totalRevenue: revenueData[0]?.totalRevenue || 0,
          totalTransactions: revenueData[0]?.totalTransactions || 0,
        },
        planBreakdown: planBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        dailySignups,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard stats.',
    });
  }
};
