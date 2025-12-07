import nodemailer from "nodemailer";
import { SMTP_CONFIG, EMAIL_CONFIG } from "./constants.js";

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: SMTP_CONFIG.auth,
  });
};

export { EMAIL_CONFIG };
