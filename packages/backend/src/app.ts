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
import userRoutes from "./modules/users/users.routes";
import { env } from "./config/env";
import { errorHandler, HttpError } from "./common/middleware/error.middleware";
import { notFoundHandler } from "./common/middleware/notfound.middleware";
import { swaggerDocument } from "./config/swagger";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/resumes", analysisRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/users", userRoutes);

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
