const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { startQueueConsumer } = require('./controllers/sqs.controller');
const { initializeSocket } = require('./controllers/socket.controller');
const { startSubscriptionCronJob } = require('./jobs/subscriptionCron');
const Env_Configuration =require('./config/env');


const PORT = Env_Configuration.PORT;

// Connect to MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with the server
initializeSocket(server);

// Start SQS queue consumer
startQueueConsumer();

// Start subscription CRON job
startSubscriptionCronJob();

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${Env_Configuration.NODE_ENV}`);
  console.log(`🔗 Database: ${Env_Configuration.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log(`🌐 Frontend URL: ${Env_Configuration.FRONTEND_URL || 'http://localhost:8080'}`);
  console.log(`🔌 Socket.io server initialized and available at http://localhost:${PORT}`);
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