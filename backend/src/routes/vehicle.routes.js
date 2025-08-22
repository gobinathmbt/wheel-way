
const express = require('express');
const { protect, authorize, companyScopeCheck } = require('../middleware/auth');
const {
  getVehicleStock,
  getVehicleDetail,
  bulkImportVehicles,
  updateVehicle,
  deleteVehicle,
  receiveVehicleData,
  processQueueManually
} = require('../controllers/vehicle.controller');

const router = express.Router();

// Public route for external vehicle data (no auth required)
router.post('/receive', receiveVehicleData);

// Admin route for manual queue processing (no company scope check needed)
router.post('/process-queue', protect, authorize('master_admin', 'company_super_admin'), processQueueManually);

// Apply auth middleware to remaining routes
router.use(protect);
router.use(authorize('company_super_admin', 'company_admin'));
router.use(companyScopeCheck);

// Vehicle management routes
router.get('/stock', getVehicleStock);
router.get('/detail/:vehicleId', getVehicleDetail);
router.post('/bulk-import', bulkImportVehicles);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;
