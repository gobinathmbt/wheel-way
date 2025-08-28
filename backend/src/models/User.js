
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  first_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  last_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['company_super_admin', 'company_admin', 'company_user'],
    required: true
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  permissions: [{
    type: String,
    trim: true
  }],
  module_access: [{
    type: String,
    enum: [
      'dashboard', 
      'users', 
      'permissions', 
      'dropdown_master', 
      'inspection_config', 
      'tradein_config', 
      'vehicle_stock', 
      'inspection_list', 
      'tradein_list', 
      'settings'
    ],
    trim: true
  }],
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  email_verification_token: String,
  password_reset_token: String,
  password_reset_expires: Date,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ company_id: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ is_active: 1 });

// Update timestamp on save
UserSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get user's full name
UserSchema.methods.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

module.exports = mongoose.model('User', UserSchema);
