// Runs before each test file: configure env before the app is required
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-testing-only';
process.env.JWT_EXPIRE = '1h';
