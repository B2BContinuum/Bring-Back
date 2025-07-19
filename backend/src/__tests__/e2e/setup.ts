import { Server } from 'http';
import express from 'express';
import request from 'supertest';
import { setupServer } from '../../server';
import { Pool } from 'pg';

// Mock database connection for E2E tests
jest.mock('../../config/database', () => {
  const testPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'test_community_delivery',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  return {
    pool: testPool,
    query: (...args: any[]) => testPool.query(...args),
  };
});

// Mock notification services
jest.mock('../../services/NotificationService', () => {
  return {
    NotificationService: {
      sendPushNotification: jest.fn().mockResolvedValue(true),
      registerDevice: jest.fn().mockResolvedValue(true),
      unregisterDevice: jest.fn().mockResolvedValue(true),
    },
  };
});

// Mock payment provider
jest.mock('../../providers/StripePaymentProvider', () => {
  return {
    StripePaymentProvider: {
      createPaymentIntent: jest.fn().mockResolvedValue({ id: 'test_payment_intent_id', client_secret: 'test_client_secret' }),
      capturePayment: jest.fn().mockResolvedValue(true),
      refundPayment: jest.fn().mockResolvedValue(true),
      createTransfer: jest.fn().mockResolvedValue(true),
    },
  };
});

// Test server setup and teardown
export const setupTestServer = async () => {
  const app = express();
  await setupServer(app);
  const server = app.listen();
  
  return {
    app,
    server,
    request: request(app),
    cleanup: async () => {
      server.close();
    }
  };
};

// Helper to create test users
export const createTestUser = async (request: request.SuperTest<request.Test>, userData: any) => {
  const response = await request
    .post('/api/auth/register')
    .send(userData);
  
  return {
    user: response.body.user,
    token: response.body.token,
  };
};

// Helper to create test location
export const createTestLocation = async (request: request.SuperTest<request.Test>, token: string, locationData: any) => {
  const response = await request
    .post('/api/locations')
    .set('Authorization', `Bearer ${token}`)
    .send(locationData);
  
  return response.body;
};

// Helper to create test trip
export const createTestTrip = async (request: request.SuperTest<request.Test>, token: string, tripData: any) => {
  const response = await request
    .post('/api/trips')
    .set('Authorization', `Bearer ${token}`)
    .send(tripData);
  
  return response.body;
};

// Helper to create test request
export const createTestRequest = async (request: request.SuperTest<request.Test>, token: string, requestData: any) => {
  const response = await request
    .post('/api/requests')
    .set('Authorization', `Bearer ${token}`)
    .send(requestData);
  
  return response.body;
};