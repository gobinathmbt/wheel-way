const express = require('express');
const { protect, authorize, companyScopeCheck } = require('../middleware/auth');
const {
  updateVehicleDealership,
  getVehiclesForBulkOperations,
} = require('../controllers/commonvehicle.controller');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('company_super_admin', 'company_admin'));
router.use(companyScopeCheck);

// Bulk operations routes
router.put('/update-dealership', updateVehicleDealership);
router.get('/bulk-operations', getVehiclesForBulkOperations);

module.exports = router;