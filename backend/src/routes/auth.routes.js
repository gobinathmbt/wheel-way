
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
  body('plan_id')
    .isIn(['basic', 'intermediate', 'pro'])
    .withMessage('Valid plan selection is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], validateRequest, registerCompany);

// @route   GET /api/auth/me
router.get('/me', protect, getMe);

module.exports = router;
