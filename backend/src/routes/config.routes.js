
const express = require('express');
const { protect, authorize, companyScopeCheck } = require('../middleware/auth');
const {
  getInspectionConfigs,
  getInspectionConfigDetails,
  createInspectionConfig,
  updateInspectionConfig,
  deleteInspectionConfig,
  addInspectionSection,
  addInspectionField,
  updateInspectionField,
  deleteInspectionField,
  getTradeinConfigs,
  createTradeinConfig,
  updateTradeinConfig,
  deleteTradeinConfig,
  addTradeinSection,
  addTradeinField
} = require('../controllers/config.controller');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('company_super_admin', 'company_admin'));
router.use(companyScopeCheck);

// Inspection configuration routes
router.get('/inspection', getInspectionConfigs);
router.get('/inspection/:id', getInspectionConfigDetails);
router.post('/inspection', authorize('company_super_admin'), createInspectionConfig);
router.put('/inspection/:id', authorize('company_super_admin'), updateInspectionConfig);
router.delete('/inspection/:id', authorize('company_super_admin'), deleteInspectionConfig);
router.post('/inspection/:id/categories/:categoryId/sections', authorize('company_super_admin'), addInspectionSection);
router.post('/inspection/:id/sections/:sectionId/fields', authorize('company_super_admin'), addInspectionField);
router.put('/inspection/:id/fields/:fieldId', authorize('company_super_admin'), updateInspectionField);
router.delete('/inspection/:id/fields/:fieldId', authorize('company_super_admin'), deleteInspectionField);

// Trade-in configuration routes
router.get('/tradein', getTradeinConfigs);
router.post('/tradein', authorize('company_super_admin'), createTradeinConfig);
router.put('/tradein/:id', authorize('company_super_admin'), updateTradeinConfig);
router.delete('/tradein/:id', authorize('company_super_admin'), deleteTradeinConfig);
router.post('/tradein/:id/sections', authorize('company_super_admin'), addTradeinSection);
router.post('/tradein/:id/sections/:sectionId/fields', authorize('company_super_admin'), addTradeinField);

module.exports = router;
