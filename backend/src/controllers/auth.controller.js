
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const MasterAdmin = require('../models/MasterAdmin');
const User = require('../models/User');
const Company = require('../models/Company');
const Plan = require('../models/Plan');
const mailService = require('../config/mailer');
const { logEvent } = require('./logs.controller');
const config = require('../config/env');

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role,
      company_id: user.company_id 
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE }
  );
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in both MasterAdmin and User collections
    let user = await MasterAdmin.findOne({ email }).select('+password');
    let userType = 'master_admin';

    if (!user) {
      user = await User.findOne({ email }).select('+password').populate('company_id');
      userType = 'user';
    }

    if (!user) {
      await logEvent({
        event_type: 'auth',
        event_action: 'login_failed',
        event_description: `Failed login attempt for email: ${email}`,
        severity: 'warning',
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        metadata: { email, reason: 'user_not_found' }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // For regular users, check if account is locked
    if (userType === 'user' && user.isAccountLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      if (userType === 'user') {
        await user.incrementLoginAttempts();
      }

      await logEvent({
        event_type: 'auth',
        event_action: 'login_failed',
        event_description: `Failed login attempt for email: ${email}`,
        severity: 'warning',
        user_id: user._id,
        company_id: user.company_id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        metadata: { email, reason: 'invalid_password' }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts if login is successful
    if (userType === 'user' && user.login_attempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Prepare user data for response
    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      is_first_login: user.is_first_login || false
    };

    if (userType === 'user') {
      userData.username = user.username;
      userData.company_name = user.company_id?.company_name;
    } else {
      userData.first_name = user.first_name;
      userData.last_name = user.last_name;
    }

    await logEvent({
      event_type: 'auth',
      event_action: 'login_success',
      event_description: `Successful login for ${user.email}`,
      user_id: user._id,
      company_id: user.company_id,
      user_role: user.role,
      ip_address: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Register new company
// @route   POST /api/auth/register-company
// @access  Public
const registerCompany = async (req, res) => {
  try {
    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      plan_id
    } = req.body;

    // Check if company email already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this email already exists'
      });
    }

    // Check if user with this email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate plan
    const plan = await Plan.findOne({ name: plan_id, is_active: true });
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    // Create company
    const company = new Company({
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      plan_id: plan._id,
      user_limit: plan.user_limit
    });

    await company.save();

    // Create company super admin user
    const defaultPassword = 'Welcome@123';
    const username = email.split('@')[0] + '_admin';

    const superAdmin = new User({
      username,
      email,
      password: defaultPassword,
      first_name: contact_person.split(' ')[0],
      last_name: contact_person.split(' ').slice(1).join(' ') || '',
      role: 'company_super_admin',
      company_id: company._id,
      is_first_login: true
    });

    await superAdmin.save();

    // Update company user count
    company.current_user_count = 1;
    await company.save();

    // Send welcome email
    try {
      await mailService.sendWelcomeEmail({
        email,
        company_name,
        login_credentials: {
          email,
          password: defaultPassword
        }
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with registration even if email fails
    }

    await logEvent({
      event_type: 'user_management',
      event_action: 'company_registration',
      event_description: `New company registered: ${company_name}`,
      company_id: company._id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      metadata: { company_name, email, plan: plan.name }
    });

    res.status(201).json({
      success: true,
      message: 'Company registered successfully. Please check your email for login credentials.',
      company: {
        id: company._id,
        name: company_name,
        email,
        plan: plan.display_name
      }
    });

  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering company'
    });
  }
};

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    let user;
    
    if (req.user.role === 'master_admin') {
      user = await MasterAdmin.findById(req.user.id);
    } else {
      user = await User.findById(req.user.id).populate('company_id');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = {
      id: user._id,
      email: user.email,
      role: user.role,
      company_id: user.company_id?._id,
      is_first_login: user.is_first_login || false
    };

    if (user.role !== 'master_admin') {
      userData.username = user.username;
      userData.company_name = user.company_id?.company_name;
    } else {
      userData.first_name = user.first_name;
      userData.last_name = user.last_name;
    }

    res.status(200).json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  login,
  registerCompany,
  getMe
};
