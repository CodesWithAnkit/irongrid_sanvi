import { setupTestDatabase, teardownTestDatabase, cleanTestDatabase } from '../src/test/database-test-setup';

// Global setup for e2e tests
beforeAll(async () => {
  console.log('Setting up e2e test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-for-e2e';
  process.env.JWT_EXPIRES_IN = '1h';
  
  // Setup test database
  await setupTestDatabase();
}, 120000); // 2 minutes timeout for database setup

// Clean database before each test
beforeEach(async () => {
  await cleanTestDatabase();
}, 30000);

// Global teardown for e2e tests
afterAll(async () => {
  console.log('Tearing down e2e test environment...');
  await teardownTestDatabase();
}, 60000);

// Mock external services for e2e tests
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({
        Location: 'https://test-bucket.s3.amazonaws.com/test-file.pdf',
        Key: 'test-file.pdf',
      }),
    }),
    getSignedUrl: jest.fn().mockReturnValue('https://test-signed-url.com'),
    deleteObject: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({}),
    }),
  })),
}));

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));