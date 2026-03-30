module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup-env.ts"],
  moduleFileExtensions: ["ts", "js"],
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        types: ["jest"]
      }
    }
  }
};
