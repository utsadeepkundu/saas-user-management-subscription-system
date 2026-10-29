import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { HiOutlineLockClosed } from 'react-icons/hi';
import api from '../../utils/api';
import './Auth.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      toast.error('Use at least 8 characters, including uppercase, lowercase, and a number.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${encodeURIComponent(token || '')}`, { password });
      toast.success(data.message || 'Password reset successfully.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'This reset link may be invalid or expired.');
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
            <h1 className="auth-title">Choose a new password</h1>
            <p className="auth-subtitle">Use at least 8 characters, including uppercase, lowercase, and a number.</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">New Password</label>
              <div className="input-wrapper"><HiOutlineLockClosed className="input-icon" /><input id="new-password" className="form-input with-icon" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required autoComplete="new-password" /></div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
              <div className="input-wrapper"><HiOutlineLockClosed className="input-icon" /><input id="confirm-password" className="form-input with-icon" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} required autoComplete="new-password" /></div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>{loading ? 'Updating…' : 'Reset password'}</button>
          </form>
          <div className="auth-footer"><Link to="/login" className="auth-link">Back to sign in</Link></div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
