import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("file:./dev.db"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5174"),
  FRONTEND_URL: z.string().optional(),
  CLIENT_ORIGINS: z.string().optional(),
  
  // Gemini AI Configuration (FREE TIER)
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash-latest"), // Free tier: 15K/day
  GEMINI_FALLBACK_ENABLED: z.string().default("true").transform((value) => value !== "false"),
  
  // Caching Configuration (Essential for free tier)
  CACHE_TTL_MINUTES: z.coerce.number().default(120), // 2 hour cache to reduce API calls
  CACHE_ENABLED: z.string().default("true").transform((value) => value !== "false"),
  
  // Automation
  AUTOMATION_ENABLED: z.string().default("true").transform((value) => value !== "false"),
  AUTOMATION_INTERVAL_MS: z.coerce.number().default(21600000),
  AUTOMATION_INITIAL_DELAY_MS: z.coerce.number().default(15000),
  
  // Monitoring & Analytics
  LOG_LEVEL: z.string().default("info")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;
