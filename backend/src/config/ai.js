import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_CONFIG } from "./constants.js";

// Initialize Gemini client - API key must be set in .env
export const ai = new GoogleGenAI({
  apiKey: GEMINI_CONFIG.GEMINI_API_KEY,
});

// Model configuration
export const GEMINI_MODEL = "gemini-flash-latest";

// Export Type for use in services
export { Type };
