// Jest setup file for backend tests

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test_db';

// Global mock for console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Increase timeout for async operations
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Any global cleanup
});
