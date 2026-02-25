import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

// Setup in-memory database before tests
before(async function() {
  this.timeout(60000); // Increase timeout for MongoDB setup
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set environment variables for test
  process.env.MONGO_URI = mongoUri;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.YOUTUBE_API_KEY = 'test_key';
});

// Cleanup after tests
after(async function() {
  this.timeout(10000);
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clean database between tests
beforeEach(async function() {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});
