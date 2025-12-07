import dotenv from "dotenv";

dotenv.config();

/**
 * Backend Configuration
 * All environment variables should be accessed through this config file
 */

// Get value from process.env - all values must be set in .env
const getEnv = (key) => {
  return process.env[key];
};

// Validate required environment variables on startup
const requiredEnvVars = [
  "PORT",
  "MONGODB_URI",
  "GEMINI_API_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "IMAP_HOST",
  "IMAP_PORT",
  "IMAP_USER",
  "IMAP_PASS",
  "EMAIL_FROM",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}`
  );
  console.error("Please check your .env file");
}

// Server Configuration
export const SERVER_CONFIG = {
  NODE_ENV: getEnv("NODE_ENV"),
  PORT: parseInt(getEnv("PORT"), 10),
};

// Database Configuration
export const DB_CONFIG = {
  MONGODB_URI: getEnv("MONGODB_URI"),
};

// Gemini Configuration
export const GEMINI_CONFIG = {
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY"),
};

// SMTP Configuration
export const SMTP_CONFIG = {
  host: getEnv("SMTP_HOST"),
  port: parseInt(getEnv("SMTP_PORT"), 10),
  secure: getEnv("SMTP_SECURE") === "true",
  auth: {
    user: getEnv("SMTP_USER"),
    pass: getEnv("SMTP_PASS"),
  },
};

// IMAP Configuration
export const IMAP_CONFIG = {
  imap: {
    user: getEnv("IMAP_USER"),
    password: getEnv("IMAP_PASS"),
    host: getEnv("IMAP_HOST"),
    port: parseInt(getEnv("IMAP_PORT"), 10),
    tls: getEnv("IMAP_SECURE") === "true",
    tlsOptions: { rejectUnauthorized: false },
    mailbox: "INBOX",
  },
};

// Email Configuration
export const EMAIL_CONFIG = {
  from: getEnv("EMAIL_FROM"),
  fromName: getEnv("EMAIL_FROM_NAME"),
};
