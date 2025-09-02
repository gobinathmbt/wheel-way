
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  company_name: {
    type: String,
    required: true,
    trim: true
  },
  contact_person: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    default: null
  },
  subscription_status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'trial', 'grace_period'],
    default: 'inactive'
  },
  subscription_start_date: {
    type: Date,
    default: null
  },
  subscription_end_date: {
    type: Date,
    default: null
  },
  subscription_days: {
    type: Number,
    default: 0
  },
  user_limit: {
    type: Number,
    default: 0
  },
  current_user_count: {
    type: Number,
    default: 0
  },
  selected_modules: [{
    type: String
  }],
  subscription_amount: {
    type: Number,
    default: 0
  },
  s3_config: {
    bucket: String,
    access_key: String,
    secret_key: String,
    region: String,
    url: String
  },
  callback_url: String,
  integration_settings: {
    webhook_url: String,
    api_key: String,
    auth_token: String
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterAdmin'
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

// Update timestamp on save
CompanySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Check if company is in grace period
CompanySchema.methods.isInGracePeriod = function() {
  if (!this.subscription_end_date) return false;
  
  const now = new Date();
  const endDate = new Date(this.subscription_end_date);
  const gracePeriodEnd = new Date(endDate.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days grace period
  
  return now > endDate && now <= gracePeriodEnd;
};

// Check if subscription is expired (beyond grace period)
CompanySchema.methods.isSubscriptionExpired = function() {
  if (!this.subscription_end_date) return true;
  
  const now = new Date();
  const endDate = new Date(this.subscription_end_date);
  const gracePeriodEnd = new Date(endDate.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days grace period
  
  return now > gracePeriodEnd;
};

// Get grace period days remaining
CompanySchema.methods.getGracePeriodDaysRemaining = function() {
  if (!this.subscription_end_date) return 0;
  
  const now = new Date();
  const endDate = new Date(this.subscription_end_date);
  const gracePeriodEnd = new Date(endDate.getTime() + (2 * 24 * 60 * 60 * 1000));
  
  if (now <= endDate) return 0; // Not in grace period yet
  if (now > gracePeriodEnd) return -1; // Grace period expired
  
  const diffTime = gracePeriodEnd.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Virtual for company age
CompanySchema.virtual('company_age').get(function() {
  return Math.floor((Date.now() - this.created_at) / (1000 * 60 * 60 * 24));
});

// Index for efficient queries
CompanySchema.index({ email: 1 });
CompanySchema.index({ subscription_status: 1 });

module.exports = mongoose.model('Company', CompanySchema);
