/**
 * Jest Setup File - Run before all tests
 */

// Set test environment
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/resume_test";
process.env.JWT_ACCESS_SECRET = "test_secret_key_for_testing_purposes_only";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_key_for_testing_purposes_only";

// Suppress console logs during tests (comment out to debug)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

console.log("🧪 Test environment initialized");
