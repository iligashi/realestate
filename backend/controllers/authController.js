const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// User Registration
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, userType, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      userType,
      phone
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// User Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({ 
        error: 'Account is temporarily locked. Please try again later.' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password) and token
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// Get Current User Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    console.log('=== UPDATE PROFILE DEBUG ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body keys:', Object.keys(req.body));
    console.log('File:', req.file);
    console.log('===========================');
    
    let updates = {};
    
    // Handle FormData vs JSON
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      // Handle FormData (profile picture upload)
      const formData = req.body;
      
      // Extract text fields - be very careful with profilePicture
      Object.keys(formData).forEach(key => {
        console.log(`Processing key: ${key}, value:`, formData[key], 'type:', typeof formData[key]);
        
        // Handle profilePicture field very carefully
        if (key === 'profilePicture') {
          console.log('Found profilePicture field in formData');
          
          // If it's a string and looks like a path, it might be the existing path
          if (typeof formData[key] === 'string' && formData[key].trim() !== '') {
            console.log('profilePicture is a non-empty string, keeping existing path');
            // Don't update profilePicture if it's just the existing path
          } else {
            console.log('profilePicture field is empty or invalid, ignoring');
          }
          return; // Skip this field
        }
        
        if (key === 'socialLinks' || key === 'specialties') {
          try {
            updates[key] = JSON.parse(formData[key]);
          } catch (e) {
            updates[key] = formData[key];
          }
        } else {
          updates[key] = formData[key];
        }
      });
      
      // Handle profile picture file from multer - ONLY if file exists and is valid
      if (req.file && req.file.path && typeof req.file.path === 'string') {
        console.log('Adding NEW profile picture from req.file:', req.file.path);
        updates.profilePicture = req.file.path;
      } else {
        console.log('No valid profile picture file uploaded');
      }
    } else {
      // Handle JSON data
      updates = req.body;
      
      // For JSON requests, don't allow profilePicture updates (security)
      if (updates.profilePicture !== undefined) {
        console.log('Removing profilePicture from JSON update for security');
        delete updates.profilePicture;
      }
    }
    
    console.log('Processed updates:', updates);
    
    // Remove sensitive fields that shouldn't be updated
    delete updates.password;
    delete updates.email;
    delete updates.userType;
    delete updates.isVerified;
    delete updates.isActive;
    delete updates.isBlocked;
    delete updates._id;
    delete updates.__v;

    // Validate and sanitize updates
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'bio', 'location', 'company', 
      'licenseNumber', 'specialties', 'socialLinks', 'profilePicture',
      'preferences', 'notificationSettings'
    ];

    const sanitizedUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && updates[key] !== undefined && updates[key] !== null) {
        // Additional validation for profilePicture
        if (key === 'profilePicture') {
          if (typeof updates[key] === 'string' && updates[key].trim() !== '') {
            sanitizedUpdates[key] = updates[key];
            console.log('Valid profilePicture path added:', updates[key]);
          } else {
            console.log('Invalid profilePicture value, skipping:', updates[key]);
          }
        } else {
          sanitizedUpdates[key] = updates[key];
        }
      }
    });

    console.log('Sanitized updates:', sanitizedUpdates);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: sanitizedUpdates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// Change Password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password.' });
  }
};

// Extend session (refresh token)
const extendSession = async (req, res) => {
  try {
    // Update last login time to extend session
    const user = await User.findById(req.user._id);
    user.lastLogin = new Date();
    await user.save();

    res.json({ 
      message: 'Session extended successfully',
      lastLogin: user.lastLogin
    });
  } catch (error) {
    console.error('Extend session error:', error);
    res.status(500).json({ error: 'Failed to extend session.' });
  }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed.' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  extendSession,
  logout
};
