import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 0
  },
  content: {
    type: Buffer,
    default: null
  },
  extractedText: {
    type: String,
    default: ''
  }
}, { _id: false });

const proposalSchema = new mongoose.Schema({
  rfpId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RFP',
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  proposalNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  emailMessageId: {
    type: String,
    sparse: true,  // Allow null but unique when present
    index: true
  },
  emailContent: {
    subject: {
      type: String,
      default: ''
    },
    from: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    html: {
      type: String,
      default: ''
    }
  },
  extractedData: {
    totalPrice: {
      type: Number,
      default: 0
    },
    items: [{
      name: String,
      quantity: Number,
      unitPrice: Number,
      totalPrice: Number,
      specifications: String
    }],
    paymentTerms: {
      type: String,
      default: ''
    },
    deliveryTerms: {
      type: String,
      default: ''
    },
    warranty: {
      type: String,
      default: ''
    },
    compliance: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    notes: {
      type: String,
      default: ''
    }
  },
  attachments: {
    type: [attachmentSchema],
    default: []
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'parsed', 'reviewed', 'rejected'],
    default: 'pending'
  },
  parsingError: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
proposalSchema.index({ rfpId: 1 });
proposalSchema.index({ vendorId: 1 });
proposalSchema.index({ status: 1 });
proposalSchema.index({ receivedAt: -1 });

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal;

