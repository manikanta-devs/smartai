import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./modules/auth/auth.routes";
import resumeRoutes from "./modules/resume/resume.routes";
import analysisRoutes from "./modules/resume/analysis.routes";
import jobRoutes from "./modules/jobs/jobs.routes";
import automationRoutes from "./modules/automation/automation.routes";
import userRoutes from "./modules/users/users.routes";
import rejectionAnalyzerRoutes from "./modules/analysis/rejection.routes";
import coachRoutes from "./modules/coach/coach.routes";
import versionsRoutes from "./modules/resume/versions.routes";
import streakRoutes from "./modules/streak/streak.routes";
import { env } from "./config/env";
import { errorHandler, HttpError } from "./common/middleware/error.middleware";
import { notFoundHandler } from "./common/middleware/notfound.middleware";
import { swaggerDocument } from "./config/swagger";
import { loginLimiter, apiLimiter } from "./common/middleware/rateLimiter";

export const app = express();

const configuredOrigins = [
  env.CLIENT_ORIGIN,
  env.FRONTEND_URL,
  ...(env.CLIENT_ORIGINS || "").split(",")
].filter(Boolean) as string[];

const allowedOrigins = new Set([
  ...configuredOrigins.map((origin) => origin.trim()).filter(Boolean),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174"
]);

const isAllowedVercelOrigin = (origin: string) => {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
};

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || isAllowedVercelOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(apiLimiter); // UPGRADED: Global API rate limiting

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth/login", loginLimiter); // Stricter limit for login attempts
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/resumes", analysisRoutes);
app.use("/api/resumes", versionsRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/automation", automationRoutes);
app.use("/api/analysis", rejectionAnalyzerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/streak", streakRoutes);

app.get("/", (_req, res) => {
  res.redirect(env.CLIENT_ORIGIN);
});

app.use((req, res, next) => {
  const isBrowserPageRequest = req.method === "GET" && req.accepts("html") && !req.path.startsWith("/api") && req.path !== "/health" && !req.path.startsWith("/api/docs");

  if (isBrowserPageRequest) {
    return res.redirect(`${env.CLIENT_ORIGIN}${req.originalUrl}`);
  }

  return next();
});

app.use(notFoundHandler);
app.use((err: Error, _req: express.Request, _res: express.Response, next: express.NextFunction) => {
  if (err.message === "Unauthorized") {
    return next(new HttpError(401, "Unauthorized"));
  }
  if (err.message === "Forbidden") {
    return next(new HttpError(403, "Forbidden"));
  }
  return next(err);
});
app.use(errorHandler);
