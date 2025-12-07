import mongoose from "mongoose";

const jobHistorySchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["running", "success", "failed"],
      required: true,
    },
    triggeredBy: {
      type: String,
      enum: ["cron", "manual"],
      default: "cron",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // milliseconds
    },
    result: {
      processed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      emails: [{ type: mongoose.Schema.Types.Mixed }],
    },
    error: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for efficient queries - get latest runs per job
jobHistorySchema.index({ jobName: 1, createdAt: -1 });

export default mongoose.model("JobHistory", jobHistorySchema);

