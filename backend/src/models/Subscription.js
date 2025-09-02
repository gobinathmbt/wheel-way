
const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  subscription_days: {
    type: Number,
    required: true
  },
  user_count: {
    type: Number,
    required: true
  },
  selected_modules: [{
    type: String,
    required: true
  }],
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  payment_method: {
    type: String,
    enum: ['stripe', 'paypal', 'razorpay'],
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  payment_id: String,
  transaction_id: String,
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  is_renewal: {
    type: Boolean,
    default: false
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
SubscriptionSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Index for efficient queries
SubscriptionSchema.index({ company_id: 1, payment_status: 1 });
SubscriptionSchema.index({ start_date: 1, end_date: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
