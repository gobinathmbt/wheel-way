
const mongoose = require('mongoose');

const FieldConfigSchema = new mongoose.Schema({
  field_id: {
    type: String,
    required: true
  },
  field_name: {
    type: String,
    required: true
  },
  field_type: {
    type: String,
    enum: ['text', 'number', 'currency', 'video', 'dropdown', 'image', 'date', 'boolean'],
    required: true
  },
  is_required: {
    type: Boolean,
    default: false
  },
  validation_rules: {
    min_value: Number,
    max_value: Number,
    min_length: Number,
    max_length: Number,
    pattern: String
  },
  dropdown_config: {
    dropdown_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DropdownMaster'
    },
    allow_multiple: Boolean,
    custom_options: [String]
  },
  has_image: {
    type: Boolean,
    default: false
  },
  display_order: {
    type: Number,
    default: 0
  },
  placeholder: String,
  help_text: String
});

const SectionConfigSchema = new mongoose.Schema({
  section_id: {
    type: String,
    required: true
  },
  section_name: {
    type: String,
    required: true
  },
  description: String,
  display_order: {
    type: Number,
    default: 0
  },
  is_collapsible: {
    type: Boolean,
    default: true
  },
  is_expanded_by_default: {
    type: Boolean,
    default: false
  },
  fields: [FieldConfigSchema]
});

const CategoryConfigSchema = new mongoose.Schema({
  category_id: {
    type: String,
    required: true
  },
  category_name: {
    type: String,
    required: true
  },
  description: String,
  master_dropdown_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DropdownMaster'
  },
  display_order: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  sections: [SectionConfigSchema]
});

const InspectionConfigSchema = new mongoose.Schema({
  config_name: {
    type: String,
    required: true
  },
  description: String,
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_default: {
    type: Boolean,
    default: false
  },
  
  // Master categories (e.g., at_arrival, after_reconditioning, after_grooming)
  categories: [CategoryConfigSchema],
  
  // Global settings for this configuration
  settings: {
    require_photos: {
      type: Boolean,
      default: true
    },
    max_photos_per_section: {
      type: Number,
      default: 10
    },
    allow_video_upload: {
      type: Boolean,
      default: true
    },
    max_video_size_mb: {
      type: Number,
      default: 100
    },
    auto_save_interval: {
      type: Number,
      default: 30 // seconds
    },
    require_digital_signature: {
      type: Boolean,
      default: false
    }
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Ensure only one default config per company
InspectionConfigSchema.index({ company_id: 1, is_default: 1 }, {
  unique: true,
  partialFilterExpression: { is_default: true }
});

// Index for efficient queries
InspectionConfigSchema.index({ company_id: 1, is_active: 1 });

// Update timestamp on save
InspectionConfigSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('InspectionConfig', InspectionConfigSchema);
