
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getPlanConfig,
  calculateCost,
  createSubscription,
  completeSubscription,
  getSubscriptionHistory,
  getSubscriptionStatus,
  getPaymentSettings
} = require('../controllers/subscription.controller');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Routes accessible by all company users
router.get('/status', getSubscriptionStatus);
router.get('/payment-settings', getPaymentSettings);

// Routes accessible only by company super admin
router.get('/plan-config', authorize('company_super_admin'), getPlanConfig);
router.post('/calculate-cost', authorize('company_super_admin'), calculateCost);
router.post('/create', authorize('company_super_admin'), createSubscription);
router.post('/:id/complete', authorize('company_super_admin'), completeSubscription);
router.get('/history', authorize('company_super_admin'), getSubscriptionHistory);

module.exports = router;
