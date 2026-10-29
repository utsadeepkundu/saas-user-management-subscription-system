import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineUserGroup,
  HiOutlineCreditCard,
  HiOutlineChartBar,
  HiOutlineLockClosed,
  HiArrowRight,
  HiOutlineCheck,
} from 'react-icons/hi';
import './Landing.css';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const features = [
  {
    icon: <HiOutlineShieldCheck />,
    title: 'Secure Authentication',
    description: 'JWT-based auth with token refresh, password reset, and rate limiting built-in.',
  },
  {
    icon: <HiOutlineCreditCard />,
    title: 'Subscription Management',
    description: 'Flexible plans with feature gating, upgrade/downgrade flows, and billing history.',
  },
  {
    icon: <HiOutlineUserGroup />,
    title: 'Admin Dashboard',
    description: 'Full user lifecycle management with search, filtering, and bulk actions.',
  },
  {
    icon: <HiOutlineLightningBolt />,
    title: 'Blazing Fast APIs',
    description: 'RESTful endpoints with validation, error handling, and consistent responses.',
  },
  {
    icon: <HiOutlineChartBar />,
    title: 'Real-time Analytics',
    description: 'User growth, revenue metrics, and subscription breakdowns at a glance.',
  },
  {
    icon: <HiOutlineLockClosed />,
    title: 'Enterprise Security',
    description: 'Helmet headers, CORS policies, input sanitization, and account suspension.',
  },
];

const Landing = () => {
  return (
    <div className="landing">
      {/* Background Effects */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <div className="bg-blob bg-blob-3" />

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="hero-badge" variants={fadeUp}>
              <span className="badge badge-primary">
                <HiOutlineLightningBolt /> Enterprise-Grade Platform
              </span>
            </motion.div>

            <motion.h1 className="hero-title" variants={fadeUp} custom={1}>
              User Management
              <br />
              <span className="gradient-text">Reimagined</span>
            </motion.h1>

            <motion.p className="hero-subtitle" variants={fadeUp} custom={2}>
              A complete SaaS platform for authentication, subscription management,
              and admin operations. Built with scalable architecture and production-ready security.
            </motion.p>

            <motion.div className="hero-actions" variants={fadeUp} custom={3}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Free <HiArrowRight />
              </Link>
              <Link to="/pricing" className="btn btn-secondary btn-lg">
                View Plans
              </Link>
            </motion.div>

            <motion.div className="hero-stats" variants={fadeUp} custom={4}>
              <div className="hero-stat">
                <span className="hero-stat-value">99.9%</span>
                <span className="hero-stat-label">Uptime</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">10K+</span>
                <span className="hero-stat-label">Users</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-value">5ms</span>
                <span className="hero-stat-label">Avg Response</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visual - Live Management Console Preview */}
          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="hero-card glass-card">
              <div className="hero-card-header">
                <div className="hero-card-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="hero-card-title">Live Management Console</span>
              </div>
              <div className="hero-card-body">
                {/* User Snapshot */}
                <div className="preview-user-item">
                  <div className="preview-avatar">SJ</div>
                  <div className="preview-user-info">
                    <div className="preview-user-name">Sarah Jenkins</div>
                    <div className="preview-user-email">sarah.jenkins@enterprise.io</div>
                  </div>
                  <span className="badge badge-primary">Enterprise</span>
                </div>

                {/* Metrics Row */}
                <div className="preview-metrics-grid">
                  <div className="preview-metric-box">
                    <span className="preview-metric-label">Active Users</span>
                    <span className="preview-metric-val">12,480</span>
                    <span className="preview-metric-trend">+18% this month</span>
                  </div>
                  <div className="preview-metric-box">
                    <span className="preview-metric-label">Plan Health</span>
                    <span className="preview-metric-val">99.98%</span>
                    <span className="preview-metric-trend">All services active</span>
                  </div>
                </div>

                {/* Security Feature Highlights */}
                <div className="preview-status-row">
                  <div className="status-indicator">
                    <HiOutlineCheck className="status-check-icon" />
                    <span>JWT Dual-Token Rotation & Security</span>
                  </div>
                  <div className="status-indicator">
                    <HiOutlineCheck className="status-check-icon" />
                    <span>Role-Based Access Control (RBAC)</span>
                  </div>
                  <div className="status-indicator">
                    <HiOutlineCheck className="status-check-icon" />
                    <span>Automated Tier Limits & Expiry</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.span className="section-label" variants={fadeUp}>
              Features
            </motion.span>
            <motion.h2 className="section-title" variants={fadeUp} custom={1}>
              Everything you need to
              <br />
              <span className="gradient-text">manage users at scale</span>
            </motion.h2>
          </motion.div>

          <motion.div
            className="features-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card glass-card glass-card-hover"
                variants={fadeUp}
                custom={index}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-card glass-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="cta-title">
              Ready to get started?
            </h2>
            <p className="cta-subtitle">
              Create your free account and start managing users in minutes.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Free Account <HiArrowRight />
              </Link>
            </div>
            <div className="cta-features">
              <span><HiOutlineCheck /> No credit card required</span>
              <span><HiOutlineCheck /> Free plan available</span>
              <span><HiOutlineCheck /> Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="logo-text" style={{ fontSize: '1.25rem' }}>SaaSFlow</span>
              <p className="footer-tagline">Enterprise user management, simplified.</p>
            </div>
            <div className="footer-links">
              <Link to="/pricing">Pricing</Link>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} SaaSFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
