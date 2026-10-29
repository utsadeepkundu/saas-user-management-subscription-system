import User from '../models/User.js';

const publicUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isActive: user.isActive,
  isSuspended: user.isSuspended,
  subscription: user.subscription,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await user.applySubscriptionExpiry();
    return res.status(200).json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;

    if (req.body.email && req.body.email !== req.user.email) {
      const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: req.user._id } });
      if (existingUser) return res.status(409).json({ success: false, message: 'Email is already in use.' });
      updateData.email = req.body.email;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, message: 'Profile updated successfully.', data: { user: publicUser(user) } });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Email is already in use.' });
    console.error('Update profile error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password +refreshToken');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const matches = await user.comparePassword(req.body.currentPassword);
    if (!matches) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    user.password = req.body.newPassword;
    user.refreshToken = undefined; // Revoke every refresh session after credential change.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.clearCookie('accessToken', { path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.clearCookie('refreshToken', { path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    return res.status(200).json({ success: true, message: 'Password changed. Please sign in again.' });
  } catch (error) {
    console.error('Change password error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error changing password.' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.clearCookie('accessToken', { path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.clearCookie('refreshToken', { path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    return res.status(200).json({ success: true, message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error deleting account.' });
  }
};
