
const express = require('express');
const { protect, authorize, companyScopeCheck } = require('../middleware/auth');
const {
  getVehicleStock,
  getVehicleDetail,
  bulkImportVehicles,
  createVehicleStock,
  updateVehicle,
  deleteVehicle,
  receiveVehicleData,
  processQueueManually,

  updateVehicleOverview,
  updateVehicleGeneralInfo,
  updateVehicleSource,
  updateVehicleRegistration,
  updateVehicleImport,
  updateVehicleEngine,
  updateVehicleSpecifications,
  updateVehicleSafetyFeatures,
  updateVehicleOdometer,
  updateVehicleOwnership,
  getVehicleAttachments,
  uploadVehicleAttachment,
  deleteVehicleAttachment,
  updateVehicleWorkshopStatus,

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
router.post('/create-stock', createVehicleStock);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

// Vehicle section update routes
router.put('/:id/overview', updateVehicleOverview);
router.put('/:id/general-info', updateVehicleGeneralInfo);
router.put('/:id/source', updateVehicleSource);
router.put('/:id/registration', updateVehicleRegistration);
router.put('/:id/import', updateVehicleImport);
router.put('/:id/engine', updateVehicleEngine);
router.put('/:id/specifications', updateVehicleSpecifications);
router.put('/:id/safety', updateVehicleSafetyFeatures);
router.put('/:id/odometer', updateVehicleOdometer);
router.put('/:id/ownership', updateVehicleOwnership);

// Vehicle attachment routes
router.get('/:id/attachments', getVehicleAttachments);
router.post('/:id/attachments', uploadVehicleAttachment);
router.delete('/:id/attachments/:attachmentId', deleteVehicleAttachment);

// Workshop status update
router.put('/:id/workshop-status', updateVehicleWorkshopStatus);

module.exports = router;
