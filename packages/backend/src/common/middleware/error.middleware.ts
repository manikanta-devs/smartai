import { NextFunction, Request, Response } from "express";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status =
    err instanceof HttpError
      ? err.status
      : err.message === "Unauthorized"
        ? 401
        : err.message === "Forbidden"
          ? 403
          : 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ success: false, error: { message } });
};
