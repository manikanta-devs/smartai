process.env.NODE_ENV = "test";
process.env.PORT = "4000";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/resume_saas_test?schema=public";
process.env.JWT_ACCESS_SECRET = "test-access-secret-123456789";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-123456789";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
