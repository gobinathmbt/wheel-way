const mongoose = require('mongoose');

const QuoteResponseSchema = new mongoose.Schema({
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  estimated_cost: {
    type: Number,
    required: true
  },
  estimated_time: {
    type: String, // e.g., "2-3 days", "1 week"
    required: true
  },
  comments: {
    type: String
  },
  quote_pdf_url: {
    type: String // S3 URL for uploaded PDF
  },
  quote_pdf_key: {
    type: String // S3 key for deletion
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  responded_at: {
    type: Date,
    default: Date.now
  }
});

const WorkshopQuoteSchema = new mongoose.Schema({
  // Unique identifier combination
  vehicle_type: {
    type: String,
    enum: ['inspection', 'tradein'],
    required: true
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  vehicle_stock_id: {
    type: Number,
    required: true
  },
  
  // Field reference from inspection results
  field_id: {
    type: String,
    required: true
  },
  field_name: {
    type: String,
    required: true
  },
  
  // Company's quote details
  quote_amount: {
    type: Number,
    required: true
  },
  quote_description: {
    type: String
  },
  
  // Selected suppliers for this quote
  selected_suppliers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  }],
  
  // Supplier responses
  supplier_responses: [QuoteResponseSchema],
  
  // Overall status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Approved supplier
  approved_supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  approved_at: {
    type: Date
  },
  
  // Who created this quote
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timestamps
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique combination
WorkshopQuoteSchema.index({ 
  vehicle_type: 1, 
  company_id: 1, 
  vehicle_stock_id: 1, 
  field_id: 1 
}, { unique: true });

// Other indexes for efficient queries
WorkshopQuoteSchema.index({ company_id: 1, status: 1 });
WorkshopQuoteSchema.index({ 'selected_suppliers': 1 });
WorkshopQuoteSchema.index({ approved_supplier: 1 });

// Update timestamp on save
WorkshopQuoteSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('WorkshopQuote', WorkshopQuoteSchema);
