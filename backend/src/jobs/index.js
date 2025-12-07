import { startEmailCheckJob } from "./emailCheckJob.js";

/**
 * Initialize all scheduled jobs
 * Called after database connection is established
 */
export const initializeJobs = () => {
  startEmailCheckJob();
};

export {
  isEmailJobRunning,
  setEmailJobRunning,
  logManualJobRun,
} from "./emailCheckJob.js";
