import { setupTestServer, createTestUser, createTestLocation } from './setup';
import request from 'supertest';
import { Server } from 'http';

describe('Performance E2E Tests', () => {
  let testEnv: {
    app: Express.Application;
    server: Server;
    request: request.SuperTest<request.Test>;
    cleanup: () => Promise<void>;
  };
  
  let adminUser: { user: any; token: string };
  let testLocation: any;
  
  beforeAll(async () => {
    testEnv = await setupTestServer();
    
    // Create admin user
    adminUser = await createTestUser(testEnv.request, {
      email: 'admin@example.com',
      password: 'Password123!',
      name: 'Admin User',
      phone: '+15551234569'
    });
    
    // Create test location
    testLocation = await createTestLocation(testEnv.request, adminUser.token, {
      name: 'Test Mall',
      address: {
        street: '100 Mall St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      },
      category: 'SHOPPING_MALL'
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  test('Concurrent location presence tracking', async () => {
    // Create multiple test users
    const userCount = 10;
    const users = [];
    
    for (let i = 0; i < userCount; i++) {
      const user = await createTestUser(testEnv.request, {
        email: `user${i}@example.com`,
        password: 'Password123!',
        name: `Test User ${i}`,
        phone: `+1555${1000000 + i}`
      });
      users.push(user);
    }
    
    // Perform concurrent check-ins
    const checkInPromises = users.map(user => 
      testEnv.request
        .post(`/api/locations/${testLocation.id}/checkin`)
        .set('Authorization', `Bearer ${user.token}`)
        .send()
    );
    
    const checkInResults = await Promise.all(checkInPromises);
    
    // Verify all check-ins were successful
    checkInResults.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.isActive).toBe(true);
    });
    
    // Get location presence count
    const presenceResponse = await testEnv.request
      .get(`/api/locations/${testLocation.id}/presence`)
      .set('Authorization', `Bearer ${adminUser.token}`);
    
    expect(presenceResponse.status).toBe(200);
    expect(presenceResponse.body.currentUserCount).toBe(userCount);
    
    // Perform concurrent check-outs
    const checkOutPromises = users.map(user => 
      testEnv.request
        .post(`/api/locations/${testLocation.id}/checkout`)
        .set('Authorization', `Bearer ${user.token}`)
        .send()
    );
    
    const checkOutResults = await Promise.all(checkOutPromises);
    
    // Verify all check-outs were successful
    checkOutResults.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.isActive).toBe(false);
    });
  });
  
  test('High-volume trip search', async () => {
    // Create multiple trips
    const tripCount = 20;
    const trips = [];
    
    // Create multiple users for trips
    const tripUsers = [];
    for (let i = 0; i < tripCount; i++) {
      const user = await createTestUser(testEnv.request, {
        email: `tripuser${i}@example.com`,
        password: 'Password123!',
        name: `Trip User ${i}`,
        phone: `+1555${2000000 + i}`
      });
      tripUsers.push(user);
    }
    
    // Create trips with varying locations
    for (let i = 0; i < tripCount; i++) {
      const location = await createTestLocation(testEnv.request, tripUsers[i].token, {
        name: `Store ${i}`,
        address: {
          street: `${i} Store St`,
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        coordinates: {
          latitude: 37.7749 + (Math.random() * 0.1 - 0.05),
          longitude: -122.4194 + (Math.random() * 0.1 - 0.05)
        },
        category: 'GROCERY'
      });
      
      const tripResponse = await testEnv.request
        .post('/api/trips')
        .set('Authorization', `Bearer ${tripUsers[i].token}`)
        .send({
          destinationId: location.id,
          departureTime: new Date(Date.now() + 1000 * 60 * (15 + i)).toISOString(),
          estimatedReturnTime: new Date(Date.now() + 1000 * 60 * (60 + i)).toISOString(),
          capacity: 3,
          description: `Trip to Store ${i}`
        });
      
      trips.push(tripResponse.body);
    }
    
    // Create search users
    const searchUserCount = 5;
    const searchUsers = [];
    
    for (let i = 0; i < searchUserCount; i++) {
      const user = await createTestUser(testEnv.request, {
        email: `searchuser${i}@example.com`,
        password: 'Password123!',
        name: `Search User ${i}`,
        phone: `+1555${3000000 + i}`
      });
      searchUsers.push(user);
    }
    
    // Perform concurrent searches
    const searchPromises = searchUsers.map(user => 
      testEnv.request
        .get('/api/trips/nearby')
        .set('Authorization', `Bearer ${user.token}`)
        .query({
          latitude: 37.7749,
          longitude: -122.4194,
          radius: 10 // 10km radius
        })
    );
    
    const searchResults = await Promise.all(searchPromises);
    
    // Verify all searches were successful
    searchResults.forEach(response => {
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
  
  test('Concurrent payment processing', async () => {
    // Create traveler and requester
    const traveler = await createTestUser(testEnv.request, {
      email: 'traveler_perf@example.com',
      password: 'Password123!',
      name: 'Performance Traveler',
      phone: '+15551234570'
    });
    
    // Create trip
    const tripResponse = await testEnv.request
      .post('/api/trips')
      .set('Authorization', `Bearer ${traveler.token}`)
      .send({
        destinationId: testLocation.id,
        departureTime: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        estimatedReturnTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        capacity: 10,
        description: 'High capacity trip for performance testing'
      });
    
    const trip = tripResponse.body;
    
    // Create multiple requesters and requests
    const requestCount = 5;
    const requesters = [];
    const requests = [];
    
    for (let i = 0; i < requestCount; i++) {
      const requester = await createTestUser(testEnv.request, {
        email: `requester_perf${i}@example.com`,
        password: 'Password123!',
        name: `Performance Requester ${i}`,
        phone: `+1555${4000000 + i}`
      });
      requesters.push(requester);
      
      const requestResponse = await testEnv.request
        .post('/api/requests')
        .set('Authorization', `Bearer ${requester.token}`)
        .send({
          tripId: trip.id,
          items: [
            {
              name: `Item ${i}`,
              quantity: 1,
              maxPrice: 10.99,
              description: `Test item ${i}`
            }
          ],
          deliveryAddress: {
            street: `${i} Perf St`,
            city: 'Test City',
            state: 'TS',
            zipCode: '12345'
          },
          deliveryFee: 5.00,
          specialInstructions: `Test instructions ${i}`
        });
      
      requests.push(requestResponse.body);
    }
    
    // Accept all requests
    for (const request of requests) {
      await testEnv.request
        .put(`/api/requests/${request.id}/accept`)
        .set('Authorization', `Bearer ${traveler.token}`)
        .send();
    }
    
    // Update trip to purchased status
    await testEnv.request
      .put(`/api/trips/${trip.id}/status`)
      .set('Authorization', `Bearer ${traveler.token}`)
      .send({ status: 'AT_STORE' });
    
    // Mark all requests as purchased concurrently
    const purchasePromises = requests.map((request, index) => 
      testEnv.request
        .put(`/api/requests/${request.id}/status`)
        .set('Authorization', `Bearer ${traveler.token}`)
        .send({ 
          status: 'PURCHASED',
          receipt: {
            items: [
              { name: `Item ${index}`, price: 9.99, quantity: 1 }
            ],
            total: 9.99,
            receiptImageUrl: `https://example.com/receipt_perf_${index}.jpg`
          }
        })
    );
    
    const purchaseResults = await Promise.all(purchasePromises);
    
    // Verify all purchases were successful
    purchaseResults.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('PURCHASED');
    });
    
    // Mark trip as returning
    await testEnv.request
      .put(`/api/trips/${trip.id}/status`)
      .set('Authorization', `Bearer ${traveler.token}`)
      .send({ status: 'RETURNING' });
    
    // Mark all requests as delivered concurrently
    const deliveryPromises = requests.map((request, index) => 
      testEnv.request
        .put(`/api/requests/${request.id}/status`)
        .set('Authorization', `Bearer ${traveler.token}`)
        .send({ 
          status: 'DELIVERED',
          deliveryProofImageUrl: `https://example.com/delivery_proof_${index}.jpg`
        })
    );
    
    const deliveryResults = await Promise.all(deliveryPromises);
    
    // Verify all deliveries were successful
    deliveryResults.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('DELIVERED');
    });
    
    // Process payments concurrently
    const paymentPromises = requests.map((request, index) => 
      testEnv.request
        .put(`/api/requests/${request.id}/confirm`)
        .set('Authorization', `Bearer ${requesters[index].token}`)
        .send({ 
          confirmed: true,
          tip: 2.00
        })
    );
    
    const paymentResults = await Promise.all(paymentPromises);
    
    // Verify all payments were successful
    paymentResults.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COMPLETED');
    });
  });
});