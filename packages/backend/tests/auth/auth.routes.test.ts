import request from "supertest";
import { jest, describe, expect, it } from "@jest/globals";

jest.mock("../../src/modules/auth/auth.service", () => ({
  registerUser: jest.fn(async (input: { username: string }) => ({
    id: "u1",
    email: `${input.username}@resume.local`,
    username: input.username,
    role: "FREE"
  })),
  loginUser: jest.fn(async () => ({
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: { id: "u1", email: "john@example.com", username: "john", role: "FREE" }
  })),
  refreshAuth: jest.fn(async () => ({ accessToken: "new-access-token" })),
  logoutUser: jest.fn(async () => undefined)
}));

const { app } = require("../../src/app");

describe("Auth routes", () => {
  it("registers a user", async () => {
    const response = await request(app).post("/api/auth/register").send({
      username: "john",
      password: "Password123",
      firstName: "John",
      lastName: "Doe"
    });

    expect(response.status).toBe(201);
    expect(response.body.data.username).toBe("john");
    expect(response.body.data.email).toBe("john@resume.local");
  });

  it("logs in user", async () => {
    const response = await request(app).post("/api/auth/login").send({
      identifier: "john",
      password: "Password123"
    });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBe("access-token");
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("returns 401 for /me without access token", async () => {
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
  });
});
