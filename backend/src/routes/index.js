
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const masterRoutes = require('./master.routes');
const companyRoutes = require('./company.routes');
const subscriptionRoutes = require('./subscription.routes');
const dropdownRoutes = require('./dropdown.routes');
const masterDropdownRoutes = require('./master.dropdown.routes');
const configRoutes = require('./config.routes');
const vehicleRoutes = require('./vehicle.routes');
const inspectionRoutes = require('./inspection.routes');
const tradeinRoutes = require('./tradein.routes');
const permissionRoutes = require('./permission.routes');
const logsRoutes = require('./logs.routes');
const docsRoutes = require('./docs.routes');

// Use routes
router.use('/auth', authRoutes);
router.use('/master', masterRoutes);
router.use('/company', companyRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/dropdown', dropdownRoutes);
router.use('/master/dropdowns', masterDropdownRoutes);
router.use('/config', configRoutes);
router.use('/vehicle', vehicleRoutes);
router.use('/inspection', inspectionRoutes);
router.use('/tradein', tradeinRoutes);
router.use('/permission', permissionRoutes);
router.use('/logs', logsRoutes);
router.use('/docs', docsRoutes);

module.exports = router;
