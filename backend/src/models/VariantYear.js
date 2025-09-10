const mongoose = require('mongoose');

const variantYearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  displayValue: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
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

variantYearSchema.pre('save', function(next) {
  this.displayValue = this.displayName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
  this.updatedAt = Date.now();
  next();
});

variantYearSchema.index({ year: 1, displayValue: 1 }, { unique: true });

module.exports = mongoose.model('VariantYear', variantYearSchema);