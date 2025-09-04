const express = require('express');
const { protect, authorize, companyScopeCheck } = require('../middleware/auth');
const {
  getWorkshopVehicles,
  getWorkshopVehicleDetails,
  createQuote,
  getQuotesForField,
  approveSupplierQuote
} = require('../controllers/workshop.controller');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('company_super_admin', 'company_admin'));
router.use(companyScopeCheck);

// Workshop routes
router.get('/vehicles', getWorkshopVehicles);
router.get('/vehicle/:vehicleId/:vehicleType', getWorkshopVehicleDetails);
router.post('/quote', createQuote);
router.get('/quotes/:vehicle_type/:vehicle_stock_id/:field_id', getQuotesForField);
router.post('/quote/:quoteId/approve/:supplierId', approveSupplierQuote);

module.exports = router;