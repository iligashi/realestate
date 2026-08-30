const { User } = require('../models');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
};

// Update user (admin or self)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates.userType;
    
    // Check if user is updating themselves or if admin is updating
    if (id !== req.user.id.toString() && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this user.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await user.update(updates);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Only admins can delete users
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete users.' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
};

// Block/Unblock user (admin only)
const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Only admins can block/unblock users
    if (req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to modify user status.' });
    }

    await user.update({ is_blocked: !user.is_blocked });

    res.json({
      message: `User ${user.is_blocked ? 'blocked' : 'unblocked'} successfully`,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_blocked: user.is_blocked
      }
    });
  } catch (error) {
    console.error('Toggle user block error:', error);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const verifiedUsers = await User.count({ where: { is_verified: true } });
    const agents = await User.count({ where: { user_type: 'agent' } });
    const buyers = await User.count({ where: { user_type: 'buyer' } });
    const sellers = await User.count({ where: { user_type: 'seller' } });

    const stats = {
      totalUsers,
      activeUsers,
      verifiedUsers,
      agents,
      buyers,
      sellers
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserBlock,
  getUserStats
};
