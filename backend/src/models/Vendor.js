import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  contactInfo: {
    phone: {
      type: String,
      default: ''
    },
    address: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    }
  },
  metadata: {
    category: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    notes: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

// Indexes
vendorSchema.index({ email: 1 });
vendorSchema.index({ name: 1 });

const Vendor = mongoose.model('Vendor', vendorSchema);

export default Vendor;

