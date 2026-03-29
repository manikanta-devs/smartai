export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Resume SaaS API",
    version: "0.1.0",
    description: "Phase 1 auth API docs"
  },
  servers: [{ url: "http://localhost:4000" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Register user",
        responses: { "201": { description: "Created" } }
      }
    },
    "/api/auth/login": {
      post: {
        summary: "Login user",
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/auth/refresh": {
      post: {
        summary: "Refresh access token",
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/auth/logout": {
      post: {
        summary: "Logout user",
        responses: { "200": { description: "OK" } }
      }
    },
    "/api/auth/me": {
      get: {
        summary: "Current user",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } }
      }
    }
  }
};
