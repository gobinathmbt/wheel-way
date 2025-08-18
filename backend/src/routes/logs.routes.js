
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getLogs, getLogAnalytics } = require('../controllers/logs.controller');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('master_admin', 'company_super_admin'));

// Log routes
router.get('/', getLogs);
router.get('/analytics', getLogAnalytics);

module.exports = router;
