const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { startSubscriptionCronJob } = require('./jobs/subscriptionCron');

// Import routes
const authRoutes = require('./routes/auth.routes');
const masterRoutes = require('./routes/master.routes');
const companyRoutes = require('./routes/company.routes');
const dropdownRoutes = require('./routes/dropdown.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const configRoutes = require('./routes/config.routes');
const inspectionRoutes = require('./routes/inspection.routes');
const tradeinRoutes = require('./routes/tradein.routes');
const docsRoutes = require('./routes/docs.routes');
const workshopRoutes = require('./routes/workshop.routes');
const supplierRoutes = require('./routes/supplier.routes');
const supplierAuthRoutes = require('./routes/supplierAuth.routes');
const supplierDashboardRoutes = require('./routes/supplierDashboard.routes');
const dealershipRoutes = require('./routes/dealership.routes');
const masterInspectionRoutes = require('./routes/masterInspection.routes');
const logsRoutes = require('./routes/logs.routes');
const subscriptionRoutes = require('./routes/subscription.routes');

const errorHandler = require('./middleware/error');
const { logRequest } = require('./controllers/logs.controller');

// Connect to database
connectDB();

// Start CRON jobs
startSubscriptionCronJob();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:8080',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ],
  credentials: true
}));

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100 // limit each IP to 100 requests per windowMs
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// Compression middleware
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('combined'));
}

// Custom logging middleware
app.use(logRequest);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io health check endpoint
app.get('/socket/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Socket.io endpoint is available',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/dropdown', dropdownRoutes);
app.use('/api/vehicle', vehicleRoutes);
app.use('/api/config', configRoutes);
app.use('/api/inspection', inspectionRoutes);
app.use('/api/tradein', tradeinRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/workshop', workshopRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/supplier-auth', supplierAuthRoutes);
app.use('/api/supplier-dashboard', supplierDashboardRoutes);
app.use('/api/dealership', dealershipRoutes);
app.use('/api/master-inspection', masterInspectionRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;