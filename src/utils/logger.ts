import pino from "pino";

// Simplified logger configuration for Next.js compatibility
// Avoid worker threads that cause issues in Next.js API routes
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  browser: {
    asObject: true,
  },
});

export default logger;
