import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/enterprise_todo"),
  JWT_ACCESS_SECRET: z.string().min(16).default("dev-access-secret-please-change"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev-refresh-secret-please-change"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  COOKIE_NAME: z.string().default("rt")
});

export const env = schema.parse(process.env);
