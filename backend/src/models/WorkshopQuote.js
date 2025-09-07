const mongoose = require("mongoose");

const QuoteResponseSchema = new mongoose.Schema({
  supplier_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
  estimated_cost: {
    type: Number,
  },
  estimated_time: {
    type: String, // e.g., "2-3 days", "1 week"
  },
  comments: {
    type: String,
  },
  quote_pdf_url: {
    type: String, // S3 URL for uploaded PDF
  },
  quote_pdf_key: {
    type: String, // S3 key for deletion
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "not_interested"],
    default: "pending",
  },
  responded_at: {
    type: Date,
    default: Date.now,
  },
});

const WorkshopQuoteSchema = new mongoose.Schema({
  // Unique identifier combination
  vehicle_type: {
    type: String,
    enum: ["inspection", "tradein"],
    required: true,
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle", // 👈 Add this
  },
  company_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  vehicle_stock_id: {
    type: Number,
    required: true,
  },

  // Field reference from inspection results
  field_id: {
    type: String,
    required: true,
  },
  field_name: {
    type: String,
    required: true,
  },

  // Field images for reference
  images: [String],
  videos: [String],

  // Company's quote details
  quote_amount: {
    type: Number,
    required: true,
  },
  quote_description: {
    type: String,
  },

  // Selected suppliers for this quote
  selected_suppliers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
  ],

  // Supplier responses
  supplier_responses: [QuoteResponseSchema],

  // Overall status
  status: {
    type: String,
    enum: [
      "quote_request",
      "quote_sent",
      "quote_approved",
      "work_in_progress",
      "work_review",
      "completed_jobs",
      "rework",
    ],
    default: "quote_request",
  },

  // Approved supplier
  approved_supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
  },
  approved_at: {
    type: Date,
  },

  // Comment sheet for work submission
  comment_sheet: {
    final_price: {
      type: Number,
    },
    gst_amount: {
      type: Number,
    },
    amount_spent: {
      type: Number,
    },
    total_amount: {
      type: Number,
    },
    invoice_pdf_url: {
      type: String,
    },
    invoice_pdf_key: {
      type: String,
    },
    work_images: [
      {
        url: String,
        key: String,
      },
    ],
    supplier_comments: {
      type: String,
    },
    company_feedback: {
      type: String,
    },
    submitted_at: {
      type: Date,
    },
    reviewed_at: {
      type: Date,
    },
  },

  // Messages between company and supplier
  messages: [
    {
      sender_type: {
        type: String,
        enum: ["company", "supplier"],
      },
      sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "messages.sender_type",
      },
      message: {
        type: String,
        required: true,
      },
      sent_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  },
  // Work tracking
  work_started_at: {
    type: Date,
  },
  work_submitted_at: {
    type: Date,
  },
  work_completed_at: {
    type: Date,
  },

  // Who created this quote
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Timestamps
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for unique combination
WorkshopQuoteSchema.index(
  {
    vehicle_type: 1,
    company_id: 1,
    vehicle_stock_id: 1,
    field_id: 1,
  },
  { unique: true }
);

// Other indexes for efficient queries
WorkshopQuoteSchema.index({ company_id: 1, status: 1 });
WorkshopQuoteSchema.index({ selected_suppliers: 1 });
WorkshopQuoteSchema.index({ approved_supplier: 1 });

// Update timestamp on save
WorkshopQuoteSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("WorkshopQuote", WorkshopQuoteSchema);
