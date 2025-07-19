import { setupTestServer, createTestUser, createTestLocation, createTestTrip, createTestRequest } from './setup';
import request from 'supertest';
import { Server } from 'http';

describe('Trip and Delivery E2E Journey', () => {
  let testEnv: {
    app: Express.Application;
    server: Server;
    request: request.SuperTest<request.Test>;
    cleanup: () => Promise<void>;
  };
  
  let travelerUser: { user: any; token: string };
  let requesterUser: { user: any; token: string };
  let testLocation: any;
  let testTrip: any;
  let testRequest: any;
  
  beforeAll(async () => {
    testEnv = await setupTestServer();
    
    // Create test users
    travelerUser = await createTestUser(testEnv.request, {
      email: 'traveler@example.com',
      password: 'Password123!',
      name: 'Test Traveler',
      phone: '+15551234567'
    });
    
    requesterUser = await createTestUser(testEnv.request, {
      email: 'requester@example.com',
      password: 'Password123!',
      name: 'Test Requester',
      phone: '+15557654321'
    });
    
    // Create test location
    testLocation = await createTestLocation(testEnv.request, travelerUser.token, {
      name: 'Test Grocery Store',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      },
      category: 'GROCERY'
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  test('Complete trip and delivery journey', async () => {
    // Step 1: Traveler checks in to location
    const checkinResponse = await testEnv.request
      .post(`/api/locations/${testLocation.id}/checkin`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send();
    
    expect(checkinResponse.status).toBe(200);
    expect(checkinResponse.body.isActive).toBe(true);
    
    // Step 2: Traveler creates a trip
    testTrip = await createTestTrip(testEnv.request, travelerUser.token, {
      destinationId: testLocation.id,
      departureTime: new Date(Date.now() + 1000 * 60 * 15).toISOString(), // 15 minutes from now
      estimatedReturnTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour from now
      capacity: 3,
      description: 'Going to grocery store, can pick up items'
    });
    
    expect(testTrip.id).toBeDefined();
    expect(testTrip.status).toBe('ANNOUNCED');
    
    // Step 3: Requester searches for nearby trips
    const nearbyTripsResponse = await testEnv.request
      .get('/api/trips/nearby')
      .set('Authorization', `Bearer ${requesterUser.token}`)
      .query({
        latitude: 37.7749,
        longitude: -122.4194,
        radius: 10 // 10km radius
      });
    
    expect(nearbyTripsResponse.status).toBe(200);
    expect(nearbyTripsResponse.body.length).toBeGreaterThan(0);
    expect(nearbyTripsResponse.body.some((trip: any) => trip.id === testTrip.id)).toBe(true);
    
    // Step 4: Requester creates a delivery request
    testRequest = await createTestRequest(testEnv.request, requesterUser.token, {
      tripId: testTrip.id,
      items: [
        {
          name: 'Milk',
          quantity: 1,
          maxPrice: 5.99,
          description: 'Any brand, 2% preferred'
        },
        {
          name: 'Bread',
          quantity: 1,
          maxPrice: 4.99,
          description: 'Whole wheat'
        }
      ],
      deliveryAddress: {
        street: '456 Requester St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      deliveryFee: 5.00,
      specialInstructions: 'Please leave at door'
    });
    
    expect(testRequest.id).toBeDefined();
    expect(testRequest.status).toBe('PENDING');
    
    // Step 5: Traveler views and accepts the request
    const tripRequestsResponse = await testEnv.request
      .get(`/api/requests/for-trip/${testTrip.id}`)
      .set('Authorization', `Bearer ${travelerUser.token}`);
    
    expect(tripRequestsResponse.status).toBe(200);
    expect(tripRequestsResponse.body.length).toBeGreaterThan(0);
    
    const acceptResponse = await testEnv.request
      .put(`/api/requests/${testRequest.id}/accept`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send();
    
    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.status).toBe('ACCEPTED');
    
    // Step 6: Traveler updates status to AT_STORE
    const atStoreResponse = await testEnv.request
      .put(`/api/trips/${testTrip.id}/status`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send({ status: 'AT_STORE' });
    
    expect(atStoreResponse.status).toBe(200);
    expect(atStoreResponse.body.status).toBe('AT_STORE');
    
    // Step 7: Traveler marks items as purchased
    const purchasedResponse = await testEnv.request
      .put(`/api/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send({ 
        status: 'PURCHASED',
        receipt: {
          items: [
            { name: 'Milk', price: 4.99, quantity: 1 },
            { name: 'Bread', price: 3.99, quantity: 1 }
          ],
          total: 8.98,
          receiptImageUrl: 'https://example.com/receipt.jpg'
        }
      });
    
    expect(purchasedResponse.status).toBe(200);
    expect(purchasedResponse.body.status).toBe('PURCHASED');
    
    // Step 8: Traveler updates trip status to RETURNING
    const returningResponse = await testEnv.request
      .put(`/api/trips/${testTrip.id}/status`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send({ status: 'RETURNING' });
    
    expect(returningResponse.status).toBe(200);
    expect(returningResponse.body.status).toBe('RETURNING');
    
    // Step 9: Traveler marks request as delivered
    const deliveredResponse = await testEnv.request
      .put(`/api/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send({ 
        status: 'DELIVERED',
        deliveryProofImageUrl: 'https://example.com/delivery-proof.jpg'
      });
    
    expect(deliveredResponse.status).toBe(200);
    expect(deliveredResponse.body.status).toBe('DELIVERED');
    
    // Step 10: Requester confirms delivery and completes payment
    const confirmResponse = await testEnv.request
      .put(`/api/requests/${testRequest.id}/confirm`)
      .set('Authorization', `Bearer ${requesterUser.token}`)
      .send({ 
        confirmed: true,
        tip: 2.00
      });
    
    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.status).toBe('COMPLETED');
    
    // Step 11: Both users rate each other
    const travelerRatingResponse = await testEnv.request
      .post(`/api/users/${requesterUser.user.id}/rate`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send({
        rating: 5,
        comment: 'Great requester, clear instructions',
        requestId: testRequest.id
      });
    
    expect(travelerRatingResponse.status).toBe(200);
    
    const requesterRatingResponse = await testEnv.request
      .post(`/api/users/${travelerUser.user.id}/rate`)
      .set('Authorization', `Bearer ${requesterUser.token}`)
      .send({
        rating: 5,
        comment: 'Excellent service, items delivered as requested',
        requestId: testRequest.id
      });
    
    expect(requesterRatingResponse.status).toBe(200);
    
    // Step 12: Verify trip is completed
    const tripStatusResponse = await testEnv.request
      .get(`/api/trips/${testTrip.id}`)
      .set('Authorization', `Bearer ${travelerUser.token}`);
    
    expect(tripStatusResponse.status).toBe(200);
    expect(tripStatusResponse.body.status).toBe('COMPLETED');
  });
});