const mongoose = require('mongoose');

const vehicleMetadataSchema = new mongoose.Schema({
  make: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Make',
    required: true
  },
  model: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    required: true
  },
  body: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Body'
  },
  variantYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VariantYear'
  },
  fuelType: String,
  transmission: String,
  engineCapacity: String,
  power: String,
  torque: String,
  seatingCapacity: Number,
  // Custom fields for flexible data storage
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Additional metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Searchable tags for better filtering
  tags: [String],
  // Source tracking
  source: {
    type: String,
    enum: ['manual', 'bulk_upload', 'api'],
    default: 'manual'
  },
  batchId: String, // For tracking bulk uploads
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for better query performance
vehicleMetadataSchema.index({ make: 1, model: 1, body: 1, variantYear: 1 }, { unique: true });
vehicleMetadataSchema.index({ make: 1, model: 1 });
vehicleMetadataSchema.index({ make: 1 });
vehicleMetadataSchema.index({ tags: 1 });
vehicleMetadataSchema.index({ source: 1, batchId: 1 });
vehicleMetadataSchema.index({ createdAt: -1 });
vehicleMetadataSchema.index({ isActive: 1 });

// Text search index
vehicleMetadataSchema.index({
  '$**': 'text'
});

vehicleMetadataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('VehicleMetadata', vehicleMetadataSchema);