
const mongoose = require('mongoose');
const Env_Configuration = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(Env_Configuration.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${Env_Configuration.DB_PORT}`);
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    
    // Exit process with failure
    if (Env_Configuration.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB error: ${err.message}`);
});

module.exports = connectDB;
