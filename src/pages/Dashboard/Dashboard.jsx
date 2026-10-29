import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import {
  HiOutlineUser,
  HiOutlineCreditCard,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineFolder,
  HiOutlineDatabase,
  HiOutlineUserGroup,
  HiOutlineChartBar,
} from 'react-icons/hi';
import './Dashboard.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

const Dashboard = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data } = await api.get('/subscription');
        setSubscription(data.data.subscription);
      } catch (err) {
        // Use user's embedded subscription data
        setSubscription(user?.subscription);
      }
    };
    fetchSubscription();
  }, [user]);

  const sub = subscription || user?.subscription;
  const features = sub?.features || {};

  const statCards = [
    {
      label: 'Current Plan',
      value: sub?.plan?.charAt(0).toUpperCase() + sub?.plan?.slice(1) || 'Free',
      icon: <HiOutlineCreditCard />,
      color: 'primary',
    },
    {
      label: 'Account Status',
      value: user?.isSuspended ? 'Suspended' : 'Active',
      icon: <HiOutlineShieldCheck />,
      color: user?.isSuspended ? 'danger' : 'accent',
    },
    {
      label: 'Member Since',
      value: user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '—',
      icon: <HiOutlineClock />,
      color: 'warning',
    },
    {
      label: 'Role',
      value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'User',
      icon: <HiOutlineUser />,
      color: 'primary',
    },
  ];

  const featureCards = [
    {
      label: 'Projects',
      value: features.maxProjects === -1 ? 'Unlimited' : `${features.maxProjects || 3}`,
      icon: <HiOutlineFolder />,
    },
    {
      label: 'Storage',
      value: features.maxStorage === -1 ? 'Unlimited' : `${features.maxStorage || 500} MB`,
      icon: <HiOutlineDatabase />,
    },
    {
      label: 'Team Members',
      value: features.teamMembers === -1 ? 'Unlimited' : `${features.teamMembers || 1}`,
      icon: <HiOutlineUserGroup />,
    },
    {
      label: 'Analytics',
      value: features.analytics ? 'Enabled' : 'Disabled',
      icon: <HiOutlineChartBar />,
    },
  ];

  return (
    <div className="dashboard">
      <div className="container">
        {/* Welcome */}
        <motion.div
          className="dashboard-welcome"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="dashboard-greeting">
              Welcome back, <span className="gradient-text">{user?.name}</span>
            </h1>
            <p className="dashboard-greeting-sub">Here's your account overview</p>
          </div>
          <div className="dashboard-plan-badge">
            <span className={`badge badge-${sub?.plan === 'free' ? 'neutral' : 'primary'}`}>
              {sub?.plan} plan
            </span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="stats-grid"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              className="stat-card glass-card glass-card-hover"
              variants={fadeUp}
              custom={i}
            >
              <div className={`stat-icon ${card.color}`}>{card.icon}</div>
              <div className="stat-info">
                <span className="stat-label">{card.label}</span>
                <span className="stat-value">{card.value}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Usage */}
        <motion.div
          className="features-usage"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}
        >
          <h2 className="section-heading">Plan Features</h2>
          <div className="features-usage-grid">
            {featureCards.map((card, i) => (
              <motion.div
                key={card.label}
                className="feature-usage-card glass-card"
                variants={fadeUp}
                custom={i}
              >
                <div className="feature-usage-icon">{card.icon}</div>
                <div className="feature-usage-info">
                  <span className="feature-usage-label">{card.label}</span>
                  <span className="feature-usage-value">{card.value}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Subscription Info */}
        {sub && sub.plan !== 'free' && (
          <motion.div
            className="subscription-info glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="section-heading">Subscription Details</h2>
            <div className="sub-details">
              <div className="sub-detail">
                <span className="sub-detail-label">Status</span>
                <span className={`badge badge-${sub.status === 'active' ? 'accent' : 'warning'}`}>
                  {sub.status}
                </span>
              </div>
              <div className="sub-detail">
                <span className="sub-detail-label">Start Date</span>
                <span className="sub-detail-value">
                  {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="sub-detail">
                <span className="sub-detail-label">End Date</span>
                <span className="sub-detail-value">
                  {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="sub-detail">
                <span className="sub-detail-label">API Access</span>
                <span className={`badge badge-${features.apiAccess ? 'accent' : 'neutral'}`}>
                  {features.apiAccess ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          className="quick-actions glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="section-heading">Quick Actions</h2>
          <div className="action-buttons">
            <a href="/profile" className="btn btn-secondary">
              <HiOutlineUser /> Edit Profile
            </a>
            <a href="/subscription" className="btn btn-primary">
              <HiOutlineCreditCard /> Manage Plan
            </a>
            {user?.role === 'admin' && (
              <a href="/admin" className="btn btn-accent">
                <HiOutlineShieldCheck /> Admin Panel
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
