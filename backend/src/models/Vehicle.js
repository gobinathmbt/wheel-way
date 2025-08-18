
const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    required: true
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  
  // Basic Vehicle Information
  make: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  variant: String,
  year: Number,
  body_type: String,
  color: String,
  
  // Registration Details
  registration_number: String,
  registration_state: String,
  
  // Engine & Fuel
  fuel_type: String,
  transmission: String,
  engine_number: String,
  vin_number: String,
  
  // Ownership & History
  owner_type: String,
  kms_driven: Number,
  service_history_available: Boolean,
  number_of_keys: Number,
  
  // Insurance & Finance
  insurance_valid_till: Date,
  insurance_type: String,
  rc_available: Boolean,
  hypothecation: Boolean,
  
  // Vehicle Type & Status
  vehicle_type: {
    type: String,
    enum: ['inspection', 'tradein'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  
  // Source Information
  source: String,
  source_reference: String,
  
  // Media
  vehicle_hero_image: String,
  images: [String],
  documents: [{
    type: String,
    url: String,
    uploaded_at: Date
  }],
  
  // Processing Information
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Timestamps
  scheduled_date: Date,
  completed_date: Date,
  
  // Custom Fields (dynamic based on company configuration)
  custom_fields: mongoose.Schema.Types.Mixed,
  
  // Queue Processing
  queue_status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending'
  },
  processing_attempts: {
    type: Number,
    default: 0
  },
  last_processing_error: String,
  
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index for vehicle_id and company_id (unique per company)
VehicleSchema.index({ vehicle_id: 1, company_id: 1 }, { unique: true });

// Indexes for efficient queries
VehicleSchema.index({ company_id: 1, vehicle_type: 1, status: 1 });
VehicleSchema.index({ assigned_to: 1 });
VehicleSchema.index({ queue_status: 1 });
VehicleSchema.index({ created_at: -1 });

// Update timestamp on save
VehicleSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('Vehicle', VehicleSchema);
