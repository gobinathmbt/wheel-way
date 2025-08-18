
const express = require('express');
const { protect, authorize, companyScopeCheck } = require('../middleware/auth');
const {
  getDashboard,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  sendWelcomeEmail,
  updateS3Config,
  updateCallbackConfig,
  testS3Connection,
  testWebhook
} = require('../controllers/company.controller');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('company_super_admin', 'company_admin'));
router.use(companyScopeCheck);

// Dashboard routes
router.get('/dashboard', getDashboard);

// User management routes (only super admin)
router.get('/users', authorize('company_super_admin'), getUsers);
router.post('/users', authorize('company_super_admin'), createUser);
router.put('/users/:id', authorize('company_super_admin'), updateUser);
router.delete('/users/:id', authorize('company_super_admin'), deleteUser);
router.patch('/users/:id/status', authorize('company_super_admin'), toggleUserStatus);
router.post('/users/:id/send-welcome', authorize('company_super_admin'), sendWelcomeEmail);

// Settings routes (only super admin)
router.put('/settings/s3', authorize('company_super_admin'), updateS3Config);
router.put('/settings/callback', authorize('company_super_admin'), updateCallbackConfig);
router.post('/settings/test-s3', authorize('company_super_admin'), testS3Connection);
router.post('/settings/test-webhook', authorize('company_super_admin'), testWebhook);

module.exports = router;
