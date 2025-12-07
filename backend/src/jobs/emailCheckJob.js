import cron from "node-cron";
import { checkIncomingEmails } from "../services/email.service.js";
import JobHistory from "../models/JobHistory.js";

let isJobRunning = false;

/**
 * Start the email check cron job
 * Runs every 15 minutes to check for new vendor emails
 */
export const startEmailCheckJob = () => {
  const job = cron.schedule(
    "*/15 * * * *",
    async () => {
      if (isJobRunning) {
        return;
      }

      isJobRunning = true;
      const startTime = new Date();

      let jobRun;
      try {
        jobRun = await JobHistory.create({
          jobName: "emailCheck",
          status: "running",
          triggeredBy: "cron",
          startTime,
        });
      } catch (dbError) {
        console.error("[CRON] Failed to create job history:", dbError.message);
        // Continue with job even if history creation fails
        jobRun = null;
      }

      try {
        const result = await checkIncomingEmails();

        if (jobRun) {
          jobRun.status = "success";
          jobRun.result = {
            processed: result.processed || 0,
            failed: result.failed || 0,
            emails: result.emails || [],
          };
        }
      } catch (error) {
        if (jobRun) {
          jobRun.status = "failed";
          jobRun.error = error.message;
        }
      } finally {
        if (jobRun) {
          jobRun.endTime = new Date();
          jobRun.duration = jobRun.endTime - startTime;
          try {
            await jobRun.save();
          } catch (saveError) {
            console.error(
              "[CRON] Failed to save job history:",
              saveError.message
            );
          }
        }
        isJobRunning = false;
      }
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  );

  return job;
};

/**
 * Check if the email job is currently running
 */
export const isEmailJobRunning = () => isJobRunning;

/**
 * Set the email job running status
 */
export const setEmailJobRunning = (status) => {
  isJobRunning = status;
};

/**
 * Log a manual job run to history
 */
export const logManualJobRun = async (result, error = null) => {
  try {
    const startTime = new Date();
    await JobHistory.create({
      jobName: "emailCheck",
      status: error ? "failed" : "success",
      triggeredBy: "manual",
      startTime,
      endTime: new Date(),
      duration: 0,
      result: error
        ? { processed: 0, failed: 0, emails: [] }
        : {
            processed: result.processed || 0,
            failed: result.failed || 0,
            emails: result.emails || [],
          },
      error: error?.message || null,
    });
  } catch (dbError) {
    console.error("[MANUAL] Failed to log job history:", dbError.message);
  }
};
