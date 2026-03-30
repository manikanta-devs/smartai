import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email("Must be valid email").optional(),
  password: z.string().min(6).max(100),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional()
});

export const loginSchema = z.object({
  email: z.string().email("Must be valid email"),
  password: z.string().min(6)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
