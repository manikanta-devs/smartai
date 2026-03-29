import request from "supertest";
import { app } from "../../src/app";

jest.mock("../../src/modules/auth/auth.service", () => ({
  registerUser: jest.fn(async (input) => ({
    id: "u1",
    email: input.email,
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

describe("Auth routes", () => {
  it("returns 404 for disabled registration endpoint", async () => {
    const response = await request(app).post("/api/auth/register").send({ email: "bad" });
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("logs in user", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "john@example.com",
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
