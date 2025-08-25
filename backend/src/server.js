
const app = require('./app');
const connectDB = require('./config/db');
const { startQueueConsumer } = require('./controllers/sqs.controller');
require('./config/env');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start SQS queue consumer
startQueueConsumer();

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  const { stopQueueConsumer } = require('./controllers/sqs.controller');
  stopQueueConsumer();
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  const { stopQueueConsumer } = require('./controllers/sqs.controller');
  stopQueueConsumer();
  server.close(() => {
    console.log('💤 Process terminated');
  });
});
