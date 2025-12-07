import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    specifications: {
      type: String,
      default: "",
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const rfpSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled RFP",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    items: {
      type: [itemSchema],
      default: [],
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeline: {
      type: String,
      default: "Not specified", // e.g., "30 days", "2 weeks"
    },
    paymentTerms: {
      type: String,
      default: "", // e.g., "Net 30", "50% upfront"
    },
    warranty: {
      type: String,
      default: "", // e.g., "1 year", "2 years"
    },
    status: {
      type: String,
      enum: ["draft", "sent", "closed", "cancelled"],
      default: "draft",
    },
    structuredData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    rfpId: {
      type: String,
      unique: true,
      // Not required - auto-generated in pre-save hook
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
rfpSchema.index({ status: 1 });
rfpSchema.index({ createdAt: -1 });
// rfpId index is automatically created by unique: true, so no need to explicitly define it

// Generate unique RFP ID before saving
rfpSchema.pre("save", async function (next) {
  if (!this.rfpId) {
    this.rfpId = `RFP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

const RFP = mongoose.model("RFP", rfpSchema);

export default RFP;
