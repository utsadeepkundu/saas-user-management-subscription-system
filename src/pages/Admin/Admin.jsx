import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineCurrencyDollar,
  HiOutlineBan,
  HiOutlineSearch,
  HiOutlineCheck,
  HiOutlineTrash,
  HiOutlinePencilAlt,
} from 'react-icons/hi';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users', { params: { limit: 100 } }),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data.stats || statsRes.value.data.data);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data.data.users || []);
      }
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSuspend = async (user) => {
    setActionLoading(user._id);
    try {
      if (user.isSuspended) {
        await api.put(`/admin/users/${user._id}/reactivate`);
        toast.success(`User ${user.name} reactivated`);
      } else {
        await api.put(`/admin/users/${user._id}/suspend`, {
          reason: 'Suspended by administrator',
        });
        toast.success(`User ${user.name} suspended`);
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async (userId, newPlan) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/plan`, { plan: newPlan });
      toast.success('User plan changed successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change plan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This cannot be undone.`)) {
      return;
    }
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan =
      selectedPlan === 'all' || u.subscription?.plan === selectedPlan;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="admin-page">
      <div className="container admin-container">
        {/* Header */}
        <motion.div
          className="admin-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="admin-title">Admin Management Console</h1>
            <p className="admin-subtitle">
              Monitor subscribers, change tier plans, and manage platform security
            </p>
          </div>
          <span className="badge badge-accent">Admin Protected</span>
        </motion.div>

        {/* Stats Row */}
        {stats && (
          <div className="admin-stats-grid">
            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="stat-icon primary"><HiOutlineUserGroup /></div>
              <div className="stat-info">
                <span className="stat-label">Total Users</span>
                <span className="stat-value">{stats.totalUsers || users.length}</span>
              </div>
            </motion.div>

            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="stat-icon accent"><HiOutlineShieldCheck /></div>
              <div className="stat-info">
                <span className="stat-label">Active Subscriptions</span>
                <span className="stat-value">{stats.activeSubscriptions || 0}</span>
              </div>
            </motion.div>

            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="stat-icon warning"><HiOutlineBan /></div>
              <div className="stat-info">
                <span className="stat-label">Suspended Users</span>
                <span className="stat-value">{stats.suspendedUsers || 0}</span>
              </div>
            </motion.div>

            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="stat-icon primary"><HiOutlineCurrencyDollar /></div>
              <div className="stat-info">
                <span className="stat-label">Paid Plan Users</span>
                <span className="stat-value">{stats.paidUsers || 0}</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* User Management Section */}
        <motion.div
          className="user-management-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Controls Bar */}
          <div className="admin-controls-bar">
            <div className="search-box">
              <HiOutlineSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="plan-filter">
              <label>Filter Plan:</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="all">All Plans</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="users-table-wrapper">
            {loading ? (
              <div className="admin-loading">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="admin-empty">No users found matching criteria.</div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-sm">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="user-name">{u.name}</div>
                            <div className="user-email">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <select
                          className="plan-selector"
                          value={u.subscription?.plan || 'free'}
                          onChange={(e) => handleChangePlan(u._id, e.target.value)}
                          disabled={actionLoading === u._id}
                        >
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="professional">Professional</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </td>
                      <td>
                        <span className={`status-badge ${u.isSuspended ? 'suspended' : 'active'}`}>
                          {u.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="text-right">
                        <div className="action-buttons-group">
                          <button
                            className={`action-btn ${u.isSuspended ? 'reactivate' : 'suspend'}`}
                            title={u.isSuspended ? 'Reactivate' : 'Suspend'}
                            onClick={() => handleToggleSuspend(u)}
                            disabled={actionLoading === u._id}
                          >
                            {u.isSuspended ? <HiOutlineCheck /> : <HiOutlineBan />}
                          </button>
                          <button
                            className="action-btn delete"
                            title="Delete User"
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            disabled={actionLoading === u._id || u.role === 'admin'}
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
