import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },
    priceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    complianceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    termsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completenessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { _id: false }
);

const comparisonSchema = new mongoose.Schema(
  {
    rfpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RFP",
      required: true,
      unique: true,
    },
    proposals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal",
      },
    ],
    scores: {
      type: [scoreSchema],
      default: [],
    },
    aiSummary: {
      type: String,
      default: "",
    },
    aiRecommendation: {
      vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        default: null,
      },
      proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proposal",
        default: null,
      },
      reasoning: {
        type: String,
        default: "",
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// rfpId index is automatically created by unique: true, so no need to explicitly define it
comparisonSchema.index({ "aiRecommendation.vendorId": 1 });

const Comparison = mongoose.model("Comparison", comparisonSchema);

export default Comparison;
