
const mongoose = require('mongoose');

const GlobalLogSchema = new mongoose.Schema({
  event_type: {
    type: String,
    required: true,
    enum: [
      'auth', 'user_management', 'vehicle_operation', 'inspection',
      'tradein', 'configuration', 'api_call', 'data_export',
      'system_error', 'security_event', 'queue_operation','system_operation','supplier_operation','workshop_operation','dealership_operation'
    ]
  },
  event_action: {
    type: String,
    required: true // login, create, update, delete, view, export, etc.
  },
  event_description: {
    type: String,
    required: true
  },
  
  // User and Company Context
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  user_role: String,
  
  // Request Context
  ip_address: String,
  user_agent: String,
  request_method: String,
  request_url: String,
  request_params: mongoose.Schema.Types.Mixed,
  request_body: mongoose.Schema.Types.Mixed,
  
  // Response Context
  response_status: Number,
  response_time_ms: Number,
  
  // Resource Context
  resource_type: String, // vehicle, user, config, etc.
  resource_id: String,
  resource_data: mongoose.Schema.Types.Mixed,
  
  // Additional Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Severity and Status
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  },
  
  // Error Information
  error_code: String,
  error_message: String,
  error_stack: String,
  
  // Geolocation (optional)
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries and analytics
GlobalLogSchema.index({ created_at: -1 });
GlobalLogSchema.index({ event_type: 1, created_at: -1 });
GlobalLogSchema.index({ company_id: 1, created_at: -1 });
GlobalLogSchema.index({ user_id: 1, created_at: -1 });
GlobalLogSchema.index({ severity: 1, created_at: -1 });
GlobalLogSchema.index({ ip_address: 1 });

// Compound indexes for common queries
GlobalLogSchema.index({ company_id: 1, event_type: 1, created_at: -1 });
GlobalLogSchema.index({ user_id: 1, event_type: 1, created_at: -1 });

// TTL index to automatically delete old logs (optional - 1 year retention)
GlobalLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('GlobalLog', GlobalLogSchema);
