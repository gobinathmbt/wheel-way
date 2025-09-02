
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MasterAdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'master_admin'
  },
  smtp_settings: {
    host: String,
    port: Number,
    secure: Boolean,
    user: String,
    password: String,
    from_email: String,
    from_name: String
  },
  aws_settings: {
    access_key_id: String,
    secret_access_key: String,
    region: {
      type: String,
      default: 'us-east-1'
    },
    sqs_queue_url: String
  },
  payment_settings: {
    stripe: {
      public_key: String,
      secret_key: String,
      webhook_secret: String
    },
    paypal: {
      client_id: String,
      client_secret: String,
      mode: {
        type: String,
        enum: ['sandbox', 'live'],
        default: 'sandbox'
      }
    },
    razorpay: {
      key_id: String,
      key_secret: String,
      webhook_secret: String
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: Date,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
MasterAdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
MasterAdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp on save
MasterAdminSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('MasterAdmin', MasterAdminSchema);
