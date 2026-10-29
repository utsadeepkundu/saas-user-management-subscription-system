import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineMail } from 'react-icons/hi';
import api from '../../utils/api';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setDevResetUrl('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'If an account with that email exists, a reset link has been sent.');
      setDevResetUrl(data.data?.resetUrl || '');
    } catch (error) {
      const firstValidationError = error.response?.data?.errors?.[0]?.message;
      const errorMessage = firstValidationError || error.response?.data?.message || 'Unable to request a password reset.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />
      <motion.div className="auth-container" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-card glass-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo"><span className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>SaaSFlow</span></Link>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-subtitle">Enter your account email to receive a secure reset link.</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email Address</label>
              <div className="input-wrapper">
                <HiOutlineMail className="input-icon" />
                <input id="reset-email" className="form-input with-icon" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required autoComplete="email" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
          </form>
          {message && <p role="status" className="auth-subtitle" style={{ marginTop: 18 }}>{message}</p>}
          {devResetUrl && <div className="auth-reset-notice" style={{ marginTop: 16 }}><strong>Development-only reset link:</strong><br /><a href={devResetUrl}>{devResetUrl}</a><p>Configure Resend email delivery before deploying to production.</p></div>}
          <div className="auth-footer"><Link to="/login" className="auth-link">Back to sign in</Link></div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
