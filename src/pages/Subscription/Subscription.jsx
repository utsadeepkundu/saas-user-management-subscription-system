import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineCreditCard,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import './Subscription.css';

const planDetails = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Perfect for trying out the platform and personal tests.',
    features: [
      '3 Projects',
      '500 MB Storage',
      '1 Team Member',
      'Community Support',
    ],
    disabledFeatures: ['Custom Domain', 'Analytics', 'API Access', 'Priority Support'],
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    description: 'Great for solo developers and small independent projects.',
    features: [
      '10 Projects',
      '5 GB Storage',
      '3 Team Members',
      'Custom Domain',
    ],
    disabledFeatures: ['Analytics', 'API Access', 'Priority Support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    popular: true,
    description: 'Ideal for scaling businesses and fast-growing teams.',
    features: [
      '50 Projects',
      '50 GB Storage',
      '10 Team Members',
      'Custom Domain',
      'Advanced Analytics',
      'API Access',
      'Priority Support',
    ],
    disabledFeatures: [],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 99.99,
    yearlyPrice: 999.99,
    description: 'Unlimited resources and premium support for larger teams.',
    features: [
      'Unlimited Projects',
      'Unlimited Storage',
      'Unlimited Team Members',
      'Custom Domain',
      'Advanced Analytics',
      'Full API Access',
      'Priority Support',
    ],
    disabledFeatures: [],
  },
];

const planHierarchy = { free: 0, starter: 1, professional: 2, enterprise: 3 };

const Subscription = () => {
  const { user, updateUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [subData, setSubData] = useState(user?.subscription || null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const currentPlan = subData?.plan || user?.subscription?.plan || 'free';

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchSubscriptionData = async () => {
      try {
        const [subRes, billRes] = await Promise.allSettled([
          api.get('/subscription'),
          api.get('/subscription/billing'),
        ]);

        if (subRes.status === 'fulfilled') {
          setSubData(subRes.value.data.data.subscription);
          if (user) {
            updateUser({ ...user, subscription: subRes.value.data.data.subscription });
          }
        }

        if (billRes.status === 'fulfilled') {
          setBillingHistory(billRes.value.data.data.billingHistory || []);
        }
      } catch (err) {
        console.error('Failed to load subscription info', err);
      }
    };

    fetchSubscriptionData();
  }, [isAuthenticated, user?.id]);

  const handlePlanAction = async (targetPlanId) => {
    if (targetPlanId === currentPlan) return;

    const currentLevel = planHierarchy[currentPlan] ?? 0;
    const targetLevel = planHierarchy[targetPlanId] ?? 0;

    setLoadingPlan(targetPlanId);
    try {
      if (targetPlanId === 'free') {
        const { data } = await api.post('/subscription/cancel');
        setSubData(data.data.subscription);
        if (user) updateUser({ ...user, subscription: data.data.subscription });
        toast.success('Subscription cancelled. Reverted to Free plan.');
      } else if (targetLevel > currentLevel) {
        const { data } = await api.post('/subscription/upgrade', {
          plan: targetPlanId,
          billingCycle,
        });
        setSubData(data.data.subscription);
        if (user) updateUser({ ...user, subscription: data.data.subscription });
        toast.success(`Successfully upgraded to ${targetPlanId.toUpperCase()}!`);
      } else {
        const { data } = await api.post('/subscription/downgrade', {
          plan: targetPlanId,
        });
        setSubData(data.data.subscription);
        if (user) updateUser({ ...user, subscription: data.data.subscription });
        toast.success(`Downgraded to ${targetPlanId.toUpperCase()} plan.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="subscription-page">
      <div className="container sub-container">
        {/* Header */}
        <div className="sub-header">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className="badge badge-primary">Flexible Plans</span>
            <h1 className="sub-title">Simple, transparent pricing for everyone</h1>
            <p className="sub-desc">
              Upgrade, downgrade, or cancel anytime. No hidden fees.
            </p>
            <p className="billing-notice">Demo billing: local upgrades create simulated records only. No money is collected. Production upgrades remain disabled until a payment provider and verified webhook are configured.</p>

            {/* Billing Toggle */}
            <div className="billing-toggle-wrapper">
              <button
                className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly <span className="discount-tag">Save 17%</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-grid">
          {planDetails.map((plan, index) => {
            const isCurrent = isAuthenticated && currentPlan === plan.id;
            const price = (billingCycle === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice).toFixed(2);

            return (
              <motion.div
                key={plan.id}
                className={`pricing-card glass-card ${plan.popular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                {isCurrent && <div className="current-badge">Your Active Plan</div>}

                <div className="card-top">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-tagline">{plan.description}</p>
                  <div className="price-tag">
                    <span className="currency">$</span>
                    <span className="amount">{price}</span>
                    <span className="period">/ month</span>
                  </div>
                  {billingCycle === 'yearly' && plan.yearlyPrice > 0 && (
                    <span className="billed-yearly-label">
                      Billed annually (${plan.yearlyPrice}/yr)
                    </span>
                  )}
                </div>

                <div className="card-divider" />

                <ul className="plan-feature-list">
                  {plan.features.map((feat) => (
                    <li key={feat} className="feature-item">
                      <HiOutlineCheck className="feat-icon check" />
                      <span>{feat}</span>
                    </li>
                  ))}
                  {plan.disabledFeatures.map((feat) => (
                    <li key={feat} className="feature-item disabled">
                      <HiOutlineX className="feat-icon x" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`btn plan-btn ${
                    isCurrent
                      ? 'btn-ghost disabled'
                      : plan.popular
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                  disabled={isCurrent || loadingPlan === plan.id}
                  onClick={() => isAuthenticated ? handlePlanAction(plan.id) : navigate('/register')}
                >
                  {loadingPlan === plan.id
                    ? 'Processing...'
                    : !isAuthenticated
                    ? (plan.id === 'free' ? 'Create Free Account' : 'Get Started')
                    : isCurrent
                    ? 'Current Plan'
                    : (planHierarchy[plan.id] ?? 0) > (planHierarchy[currentPlan] ?? 0)
                    ? 'Upgrade'
                    : 'Downgrade'}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Invoices & Billing History */}
        {billingHistory && billingHistory.length > 0 && (
          <motion.div
            className="billing-history glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="billing-history-header">
              <HiOutlineDocumentText className="section-icon" />
              <h2>Billing & Invoice History</h2>
            </div>
            <div className="billing-table-wrapper">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((item, idx) => (
                    <tr key={item.invoiceId || idx}>
                      <td className="font-mono">{item.invoiceId}</td>
                      <td>{new Date(item.date).toLocaleDateString()}</td>
                      <td>{item.description}</td>
                      <td>${item.amount} {item.currency}</td>
                      <td><span className={`badge ${item.status === 'paid' ? 'badge-accent' : 'badge-neutral'}`}>{item.status === 'paid' ? 'Paid' : item.status === 'admin-grant' ? 'Admin grant' : 'Simulation — no payment'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
