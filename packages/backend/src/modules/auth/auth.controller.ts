import { Request, Response, NextFunction } from "express";
import { HttpError } from "../../common/middleware/error.middleware";
import { loginSchema, refreshSchema, registerSchema } from "./auth.schemas";
import { loginUser, logoutUser, refreshAuth, registerUser } from "./auth.service";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const user = await registerUser(input);
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);

    res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = refreshSchema.parse(req.body);
    const token = req.cookies.refreshToken || parsed.refreshToken;

    if (!token) {
      throw new HttpError(401, "Refresh token missing");
    }

    const result = await refreshAuth(token);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken || req.body?.refreshToken;
    if (token) {
      await logoutUser(token);
    }

    res.clearCookie("refreshToken");
    res.json({ success: true, data: { message: "Logged out" } });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Unauthorized");
    }

    res.json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};
