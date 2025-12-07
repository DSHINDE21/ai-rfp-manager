/**
 * Frontend Configuration
 * All environment variables should be accessed through this config file
 */

// Validate required environment variables
const requiredEnvVars = ["VITE_API_URL"];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}`
  );
  console.error("Please check your .env file");
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: import.meta.env.VITE_APP_NAME || "RFP Management System",
};

export default {
  API_CONFIG,
  APP_CONFIG,
};
