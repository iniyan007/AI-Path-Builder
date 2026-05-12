import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { createSwaggerSpec } from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { env } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key.replace(/[$.]/g, ""),
        sanitizeValue(nestedValue)
      ])
    );
  }
  return value;
}

export function createApp() {
  const app = express();
  const allowedOrigins = new Set([
    env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ]);
  const corsOptions = {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204
  };

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use((req, res, next) => {
    if (req.method === "OPTIONS") return cors(corsOptions)(req, res, next);
    next();
  });
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use((req, _res, next) => {
    if (req.body) req.body = sanitizeValue(req.body);
    next();
  });
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

  app.get("/api/health", (_req, res) => res.json({ success: true, status: "ok", timestamp: new Date().toISOString() }));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(createSwaggerSpec()));

  app.use("/api/auth", authRoutes);
  app.use("/api/workspaces", workspaceRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/analytics", analyticsRoutes);

  const frontendDist = path.resolve(__dirname, "../../frontend/dist");
  if (fs.existsSync(path.join(frontendDist, "index.html"))) {
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
      if (req.method !== "GET" || req.path.startsWith("/api")) return next();
      res.sendFile(path.join(frontendDist, "index.html"), (err) => {
        if (err) next();
      });
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
