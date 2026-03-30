/**
 * Unified Error Handling
 * Provides consistent error messages with field-level details
 */

import express from "express";
import { createErrorResponse } from "../schemas";

/**
 * Custom Application Error with field details
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public field?: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Validation Error - Use for data validation failures
 */
export class ValidationError extends AppError {
  constructor(field: string, message: string) {
    super(400, `${field}: ${message}`, field, [{ field, message }]);
    this.name = "ValidationError";
  }
}

/**
 * Multiple Field Validation Error
 */
export class MultiValidationError extends AppError {
  constructor(errors: Array<{ field: string; message: string }>) {
    const message = errors.map((e) => `${e.field}: ${e.message}`).join("; ");
    super(400, "Validation failed", undefined, errors);
    this.name = "MultiValidationError";
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(404, message);
    this.name = "NotFoundError";
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

/**
 * Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal Server Error", originalError?: Error) {
    super(500, message);
    if (originalError) {
      console.error("Internal Server Error:", originalError);
    }
    this.name = "InternalServerError";
  }
}

/**
 * Global Error Handler Middleware
 */
export function errorHandler(
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.error("[Error]", {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(
      createErrorResponse(err.message, err.errors)
    );
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    const errors = err.errors.map((e: any) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json(createErrorResponse("Validation failed", errors));
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json(createErrorResponse("Invalid token"));
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json(createErrorResponse("Token expired"));
  }

  // Handle database errors
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return res.status(400).json(
      createErrorResponse(`${field} already exists`, [
        { field, message: `This ${field} is already taken` },
      ])
    );
  }

  // Handle unexpected errors
  return res.status(500).json(
    createErrorResponse("An unexpected error occurred. Please try again later.")
  );
}

/**
 * Async handler wrapper to catch errors in routes
 */
export function asyncHandler(
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<any>
) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
