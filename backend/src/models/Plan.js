
const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  display_name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  billing_period: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  user_limit: {
    type: Number,
    required: true,
    min: 1
  },
  features: [{
    name: String,
    description: String,
    included: {
      type: Boolean,
      default: true
    },
    limit: Number // Optional limit for specific features
  }],
  custom_ui: {
    type: Boolean,
    default: false
  },
  customer_support: {
    type: String,
    enum: ['email', 'priority', 'dedicated'],
    default: 'email'
  },
  api_access: {
    type: Boolean,
    default: false
  },
  advanced_analytics: {
    type: Boolean,
    default: false
  },
  multi_location: {
    type: Boolean,
    default: false
  },
  white_label: {
    type: Boolean,
    default: false
  },
  is_active: {
    type: Boolean,
    default: true
  },
  sort_order: {
    type: Number,
    default: 0
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
PlanSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Virtual for monthly price (if yearly billing)
PlanSchema.virtual('monthly_price').get(function() {
  return this.billing_period === 'yearly' ? this.price / 12 : this.price;
});

// Index for efficient queries
PlanSchema.index({ is_active: 1, sort_order: 1 });

module.exports = mongoose.model('Plan', PlanSchema);
