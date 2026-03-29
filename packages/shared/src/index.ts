export enum UserRole {
  FREE = "FREE",
  PREMIUM = "PREMIUM",
  ENTERPRISE = "ENTERPRISE",
  ADMIN = "ADMIN"
}

export type JwtPayload = {
  userId: string;
  role: UserRole;
  email: string;
};
