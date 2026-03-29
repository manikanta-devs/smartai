import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";

export type AccessTokenPayload = {
  userId: string;
  email: string;
  role: string;
};

const accessSecret: Secret = env.JWT_ACCESS_SECRET;
const refreshSecret: Secret = env.JWT_REFRESH_SECRET;

const accessOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]
};

const refreshOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
};

export const signAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, accessSecret, accessOptions);

export const signRefreshToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, refreshSecret, refreshOptions);

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, accessSecret) as AccessTokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, refreshSecret) as AccessTokenPayload;
