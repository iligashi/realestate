const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');

let mongo;

const connect = async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
};

const clear = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

const disconnect = async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
};

let counter = 0;
const newUser = (overrides = {}) => {
  counter += 1;
  return {
    email: `user${counter}@example.com`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    userType: 'buyer',
    ...overrides
  };
};

// Registers a user through the API and returns { user, token }
const registerUser = async (overrides = {}) => {
  const res = await request(app).post('/api/auth/register').send(newUser(overrides));
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { user: res.body.user, token: res.body.token };
};

const sampleProperty = (owner, overrides = {}) => ({
  title: 'Sunny Family Home',
  description: 'A bright family home with a large garden, close to schools and parks.',
  propertyType: 'house',
  listingType: 'sale',
  status: 'active',
  price: 350000,
  owner,
  address: {
    street: '1 Test Street',
    city: 'Prishtina',
    state: 'PR',
    zipCode: '10000',
    country: 'Kosovo'
  },
  location: { type: 'Point', coordinates: [21.1655, 42.6629] },
  details: { bedrooms: 3, bathrooms: 2, squareMeters: 160 },
  ...overrides
});

module.exports = { app, request, connect, clear, disconnect, newUser, registerUser, sampleProperty };
