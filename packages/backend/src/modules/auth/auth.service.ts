import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { HttpError } from "../../common/middleware/error.middleware";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/utils/jwt";
import type { LoginInput, RegisterInput } from "./auth.schemas";

const hashToken = async (token: string) => bcrypt.hash(token, 10);

export const registerUser = async (input: RegisterInput) => {
  try {
    const existing = await prisma.user.findFirst({
      where: {
        username: input.username
      }
    });

    if (existing) {
      throw new HttpError(409, "Username already taken");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        username: input.username,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        email: `${input.username}@resume.local`
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });

    return user;
  } catch (error: any) {
    // Handle Prisma errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'username';
      throw new HttpError(409, `${field} already exists`);
    }
    
    // Handle database connection errors
    if (error.code === 'P1001') {
      console.error('Database connection error during registration:', error.message);
      throw new HttpError(503, 'Database connection failed. Please ensure PostgreSQL is running.');
    }

    // Handle invalid database URL
    if (error.code === 'P1013' || error.code === 'P1014') {
      console.error('Database URL error:', error.message);
      throw new HttpError(503, 'Database configuration error. Contact support.');
    }

    // Re-throw HttpError
    if (error instanceof HttpError) {
      throw error;
    }

    // Handle unexpected errors
    console.error('Registration error:', error);
    throw new HttpError(500, 'Registration failed. Please try again later.');
  }
};

export const loginUser = async (input: LoginInput) => {
  try {
    let user = await prisma.user.findUnique({ where: { username: input.username } });

    if (!user) {
      throw new HttpError(401, "Username or password incorrect");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new HttpError(401, "Username or password incorrect");
    }

    const payload = { userId: user.id, email: user.email, role: user.role } as const;
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const tokenHash = await hashToken(refreshToken);
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    };
  } catch (error: any) {
    // Handle database connection errors
    if (error.code === 'P1001') {
      console.error('Database connection error during login:', error.message);
      throw new HttpError(503, 'Database connection failed. Please ensure PostgreSQL is running.');
    }

    // Handle invalid database URL
    if (error.code === 'P1013' || error.code === 'P1014') {
      console.error('Database URL error:', error.message);
      throw new HttpError(503, 'Database configuration error. Contact support.');
    }

    // Re-throw HttpError
    if (error instanceof HttpError) {
      throw error;
    }

    // Handle unexpected errors
    console.error('Login error:', error);
    throw new HttpError(500, 'Login failed. Please try again later.');
  }
};

export const refreshAuth = async (token: string) => {
  try {
    const payload = verifyRefreshToken(token);
    const records = await prisma.refreshToken.findMany({ where: { userId: payload.userId } });

    let match = false;
    for (const record of records) {
      // Compare hashed refresh token records to support token rotation.
      // eslint-disable-next-line no-await-in-loop
      const isMatch = await bcrypt.compare(token, record.tokenHash);
      if (isMatch && record.expiresAt > new Date()) {
        match = true;
        break;
      }
    }

    if (!match) {
      throw new HttpError(401, "Invalid or expired refresh token");
    }

    const accessToken = signAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });

    return { accessToken };
  } catch (error: any) {
    // Handle JWT validation errors
    if (error.name === 'JsonWebTokenError') {
      throw new HttpError(401, 'Invalid refresh token');
    }

    if (error.name === 'TokenExpiredError') {
      throw new HttpError(401, 'Refresh token has expired');
    }

    // Handle database connection errors
    if (error.code === 'P1001') {
      throw new HttpError(503, 'Database connection failed. Please try again later.');
    }

    // Re-throw HttpError
    if (error instanceof HttpError) {
      throw error;
    }

    // Handle unexpected errors
    console.error('Refresh auth error:', error);
    throw new HttpError(500, 'Authentication refresh failed. Please try again.');
  }
};

export const logoutUser = async (token: string) => {
  try {
    const payload = verifyRefreshToken(token);
    const records = await prisma.refreshToken.findMany({ where: { userId: payload.userId } });

    for (const record of records) {
      // eslint-disable-next-line no-await-in-loop
      const isMatch = await bcrypt.compare(token, record.tokenHash);
      if (isMatch) {
        await prisma.refreshToken.delete({ where: { id: record.id } });
        return;
      }
    }

    // Token not found is acceptable - user is logged out
    return;
  } catch (error: any) {
    // Handle JWT validation errors
    if (error.name === 'JsonWebTokenError') {
      throw new HttpError(401, 'Invalid token');
    }

    // Handle database connection errors
    if (error.code === 'P1001') {
      throw new HttpError(503, 'Database connection failed. Please try again later.');
    }

    // Re-throw HttpError
    if (error instanceof HttpError) {
      throw error;
    }

    // Handle unexpected errors
    console.error('Logout error:', error);
    throw new HttpError(500, 'Logout failed. Please try again.');
  }
};
