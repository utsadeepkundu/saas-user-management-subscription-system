import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendReason: {
      type: String,
      default: '',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // Subscription fields embedded for simplicity
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'professional', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'expired', 'cancelled', 'trial'],
        default: 'active',
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: null,
      },
      features: {
        maxProjects: { type: Number, default: 3 },
        maxStorage: { type: Number, default: 500 }, // MB
        apiAccess: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
        customDomain: { type: Boolean, default: false },
        analytics: { type: Boolean, default: false },
        teamMembers: { type: Number, default: 1 },
      },
      billingHistory: [
        {
          amount: Number,
          currency: { type: String, default: 'USD' },
          date: { type: Date, default: Date.now },
          description: String,
          invoiceId: String,
          status: { type: String, enum: ['paid', 'simulated', 'admin-grant'], default: 'simulated' },
          paymentProvider: { type: String, default: 'none' },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if subscription is expired
userSchema.methods.isSubscriptionExpired = function () {
  if (this.subscription.plan === 'free') return false;
  if (!this.subscription.endDate) return false;
  return new Date() >= new Date(this.subscription.endDate);
};

// Make expiry enforceable from API handlers and feature-gated routes.
userSchema.methods.syncSubscriptionFeatures = function () {
  if (!this.subscription) this.subscription = {};
  const expected = this.constructor.getPlanFeatures(this.subscription.plan || 'free');
  if (!this.subscription.features) {
    this.subscription.features = expected;
    return true;
  }

  let changed = false;
  for (const [key, value] of Object.entries(expected)) {
    if (this.subscription.features[key] !== value) {
      this.subscription.features[key] = value;
      changed = true;
    }
  }
  return changed;
};

userSchema.methods.applySubscriptionExpiry = async function () {
  const expired = this.isSubscriptionExpired();
  let changed = this.syncSubscriptionFeatures();
  if (expired) {
    this.subscription.plan = 'free';
    this.subscription.status = 'expired';
    this.subscription.features = this.constructor.getPlanFeatures('free');
    changed = true;
  }
  if (changed) await this.save();
  return expired;
};

// Get plan features based on plan type
userSchema.statics.getPlanFeatures = function (plan) {
  const plans = {
    free: {
      maxProjects: 3,
      maxStorage: 500,
      apiAccess: false,
      prioritySupport: false,
      customDomain: false,
      analytics: false,
      teamMembers: 1,
    },
    starter: {
      maxProjects: 10,
      maxStorage: 5000,
      apiAccess: false,
      prioritySupport: false,
      customDomain: true,
      analytics: false,
      teamMembers: 3,
    },
    professional: {
      maxProjects: 50,
      maxStorage: 50000,
      apiAccess: true,
      prioritySupport: true,
      customDomain: true,
      analytics: true,
      teamMembers: 10,
    },
    enterprise: {
      maxProjects: -1, // Unlimited
      maxStorage: -1,
      apiAccess: true,
      prioritySupport: true,
      customDomain: true,
      analytics: true,
      teamMembers: -1,
    },
  };
  return plans[plan] || plans.free;
};

const User = mongoose.model('User', userSchema);
export default User;
