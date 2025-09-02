
const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    default: 'default'
  },
  display_name: {
    type: String,
    required: true,
    default: 'Default Plan Configuration'
  },
  description: {
    type: String,
    default: 'Plan configuration for subscription pricing'
  },
  per_user_cost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  module_costs: [{
    module_name: {
      type: String,
      required: true
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  currency: {
    type: String,
    default: 'USD'
  },
  billing_period: {
    type: String,
    enum: ['daily', 'monthly', 'yearly'],
    default: 'daily'
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
PlanSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Calculate cost based on users and modules
PlanSchema.methods.calculateCost = function(users, modules, days) {
  let totalCost = 0;
  
  // Calculate user cost
  totalCost += this.per_user_cost * users * days;
  
  // Calculate module cost
  modules.forEach(moduleName => {
    const moduleConfig = this.module_costs.find(m => m.module_name === moduleName);
    if (moduleConfig) {
      totalCost += moduleConfig.cost * days;
    }
  });
  
  return totalCost;
};

// Index for efficient queries
PlanSchema.index({ is_active: 1 });

module.exports = mongoose.model('Plan', PlanSchema);
