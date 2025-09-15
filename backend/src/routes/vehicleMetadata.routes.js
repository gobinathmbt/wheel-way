const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getMakes,
  getModels,
  getModelsByMake,
  getBodies,
  getVariantYears,
  getVehicleMetadata,
  getDropdownData,
  getCounts,
  addMake,
  addModel,
  addBody,
  addVariantYear,
  addVehicleMetadata,
  updateMake,
  updateModel,
  updateBody,
  updateVariantYear,
  updateVehicleMetadata,
  deleteMake,
  deleteModel,
  deleteBody,
  deleteVariantYear,
  deleteVehicleMetadata,
  getSchemaFields
} = require('../controllers/vehicleMetadata.controller');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('master_admin'));

// Get routes
router.get('/makes', getMakes);
router.get('/models', getModels);
router.get('/makes/:makeId/models', getModelsByMake);
router.get('/bodies', getBodies);
router.get('/variant-years', getVariantYears);
router.get('/metadata', getVehicleMetadata);
router.get('/dropdown-data', getDropdownData);
router.get('/counts', getCounts);


// Optimized bulk upload routes
router.get('/schema-fields', getSchemaFields);

// Add individual entries
router.post('/makes', addMake);
router.post('/models', addModel);
router.post('/bodies', addBody);
router.post('/variant-years', addVariantYear);
router.post('/metadata', addVehicleMetadata);

// Update routes
router.put('/makes/:id', updateMake);
router.put('/models/:id', updateModel);
router.put('/bodies/:id', updateBody);
router.put('/variant-years/:id', updateVariantYear);
router.put('/update/:id', updateVehicleMetadata);

// Delete routes
router.delete('/makes/:id', deleteMake);
router.delete('/models/:id', deleteModel);
router.delete('/bodies/:id', deleteBody);
router.delete('/variant-years/:id', deleteVariantYear);
router.delete('/delete/:id', deleteVehicleMetadata);

module.exports = router;