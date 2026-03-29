import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export type AuthUser = {
  userId: string;
  email: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return next(new Error("Unauthorized"));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
};

export const requireRole = (...roles: Array<AuthUser["role"]>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new Error("Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new Error("Forbidden"));
    }

    next();
  };
