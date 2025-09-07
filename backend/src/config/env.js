const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'GMAIL_USER',
  'GMAIL_PASSWORD'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  SOCKET_PORT: process.env.SOCKET_PORT || 5001, // Dedicated socket port
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://srinivasan:yG1DtYmc6q41KSi7@qrsclusterlearning.wtihbgw.mongodb.net/vehicle-platform',
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  
  // Email configuration
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_PASSWORD: process.env.GMAIL_PASSWORD,
  
  // AWS Configuration (optional)
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ,
  AWS_REGION: process.env.AWS_REGION ,
  S3_BUCKET: process.env.S3_BUCKET,
  
  // Redis Configuration (for queues)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080'
};