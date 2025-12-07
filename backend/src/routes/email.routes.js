import express from "express";
import { checkIncomingEmails } from "../services/email.service.js";
import {
  isEmailJobRunning,
  setEmailJobRunning,
  logManualJobRun,
} from "../jobs/index.js";
import { AppError } from "../middleware/errorHandler.js";

const router = express.Router();

// Check for incoming emails and process proposals
// Manual trigger - works alongside cron job with lock mechanism
router.post("/check", async (req, res, next) => {
  try {
    // Check if cron job is currently running
    if (isEmailJobRunning()) {
      return res.json({
        success: true,
        data: {
          processed: 0,
          emails: [],
          message:
            "Email check already in progress (scheduled job running). Please try again in a moment.",
          inProgress: true,
        },
      });
    }

    // Set lock to prevent cron job from running while manual check is in progress
    setEmailJobRunning(true);

    try {
      const result = await checkIncomingEmails();

      // Log manual job run to history
      await logManualJobRun(result);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Log failed manual job run
      await logManualJobRun(null, error);
      throw error;
    } finally {
      // Release lock
      setEmailJobRunning(false);
    }
  } catch (error) {
    setEmailJobRunning(false);
    next(new AppError(error.message, 500));
  }
});

export default router;

