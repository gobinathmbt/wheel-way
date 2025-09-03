
const express = require('express');
const { body, validationResult } = require('express-validator');
const { login, registerCompany, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// @route   POST /api/auth/login
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], validateRequest, login);

// @route   POST /api/auth/register-company
router.post('/register-company', [
  body('company_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('contact_person')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Contact person name is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  body('address')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City is required'),
  body('state')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State is required'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], validateRequest, registerCompany);

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

// @route   GET /api/auth/me/permissions
router.get('/me/permissions', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    
    if (req.user.role === 'master_admin') {
      return res.status(200).json({
        success: true,
        data: {
          permissions: ['all'] // Master admin has all permissions
        }
      });
    }

    const user = await User.findById(req.user.id).select('permissions');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        permissions: user.permissions || []
      }
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user permissions'
    });
  }
});

router.get('/me/module', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    
    if (req.user.role === 'master_admin' || req.user.role === 'company_super_admin') {
      return res.status(200).json({
        success: true,
        data: {
          module: ['all'], // Admin roles have all module access
          hasAccess: true
        }
      });
    }

    const user = await User.findById(req.user.id).select('module_access role');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has any module access
    const hasModuleAccess = user.module_access && Array.isArray(user.module_access) && user.module_access.length > 0;

    res.status(200).json({
      success: true,
      data: {
        module: user.module_access || [],
        hasAccess: hasModuleAccess,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Get user module access error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user module access'
    });
  }
});

module.exports = router;
