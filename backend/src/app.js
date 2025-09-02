
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const config = require('./config/env');
const errorHandler = require('./middleware/error');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(xss());

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/master', require('./routes/master.routes'));
app.use('/api/company', require('./routes/company.routes'));
app.use('/api/dropdown', require('./routes/dropdown.routes'));
app.use('/api/config', require('./routes/config.routes'));
app.use('/api/vehicle', require('./routes/vehicle.routes'));
app.use('/api/inspection', require('./routes/inspection.routes'));
app.use('/api/tradein', require('./routes/tradein.routes'));
app.use('/api/logs', require('./routes/logs.routes'));
app.use('/api/docs', require('./routes/docs.routes'));
app.use('/api/subscription', require('./routes/subscription.routes'));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
