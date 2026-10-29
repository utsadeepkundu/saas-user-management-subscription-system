import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineChevronDown,
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlineHome,
} from 'react-icons/hi';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = isAuthenticated
    ? [
        { path: '/dashboard', label: 'Dashboard', icon: <HiOutlineHome /> },
        { path: '/subscription', label: 'Plans', icon: <HiOutlineCreditCard /> },
        ...(user?.role === 'admin'
          ? [{ path: '/admin', label: 'Admin', icon: <HiOutlineShieldCheck /> }]
          : []),
      ]
    : [
        { path: '/', label: 'Home' },
        { path: '/pricing', label: 'Pricing' },
      ];

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="url(#logoGrad)" />
              <path d="M8 14L12 10L16 14L20 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 18L12 14L16 18L20 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">SaaSFlow</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.icon && <span className="nav-link-icon">{link.icon}</span>}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="profile-dropdown">
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="profile-avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="profile-name">{user?.name}</span>
                <HiOutlineChevronDown
                  className={`chevron ${profileOpen ? 'rotated' : ''}`}
                />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="profile-menu glass-card"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="profile-menu-header">
                      <p className="profile-menu-name">{user?.name}</p>
                      <p className="profile-menu-email">{user?.email}</p>
                      <span className={`badge badge-${user?.subscription?.plan === 'free' ? 'neutral' : 'primary'}`}>
                        {user?.subscription?.plan} plan
                      </span>
                    </div>
                    <div className="profile-menu-divider" />
                    <Link
                      to="/profile"
                      className="profile-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <HiOutlineUser /> Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="profile-menu-item"
                      onClick={() => setProfileOpen(false)}
                    >
                      <HiOutlineCog /> Settings
                    </Link>
                    <div className="profile-menu-divider" />
                    <button className="profile-menu-item danger" onClick={handleLogout}>
                      <HiOutlineLogout /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Toggle */}
          <button
            className="mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.icon && <span className="nav-link-icon">{link.icon}</span>}
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="mobile-link" onClick={() => setMobileOpen(false)}>
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="mobile-link primary"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
