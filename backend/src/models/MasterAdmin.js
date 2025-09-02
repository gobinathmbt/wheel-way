
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MasterAdminSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    default: 'master_admin'
  },
  profile_image: String,
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: Date,
  payment_settings: {
    stripe: {
      publishable_key: String,
      secret_key: String,
      webhook_secret: String
    },
    paypal: {
      client_id: String,
      client_secret: String,
      webhook_id: String
    },
    razorpay: {
      key_id: String,
      key_secret: String,
      webhook_secret: String
    }
  },
  smtp_settings: {
    host: String,
    port: Number,
    secure: Boolean,
    username: String,
    password: String,
    from_email: String,
    from_name: String
  },
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
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.updated_at = new Date();
});

// Compare password method
MasterAdminSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for full name
MasterAdminSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.last_name}`;
});

module.exports = mongoose.model('MasterAdmin', MasterAdminSchema);
