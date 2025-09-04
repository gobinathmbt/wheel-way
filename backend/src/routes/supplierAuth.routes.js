const express = require('express');
const jwt = require('jsonwebtoken');
const {
  supplierLogin,
  getSupplierVehicles,
  getSupplierVehicleDetails,
  submitSupplierResponse,
  getSupplierProfile
} = require('../controllers/supplierAuth.controller');

const router = express.Router();

// Supplier authentication middleware
const protectSupplier = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.supplier = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed'
    });
  }
};

// Public routes
router.post('/login', supplierLogin);

// Protected supplier routes
router.use(protectSupplier);
router.get('/profile', getSupplierProfile);
router.get('/vehicles', getSupplierVehicles);
router.get('/vehicle/:vehicleStockId/:vehicleType', getSupplierVehicleDetails);
router.post('/quote/:quoteId/respond', submitSupplierResponse);

module.exports = router;