import { setupTestServer, createTestUser, createTestLocation, createTestTrip, createTestRequest } from './setup';
import request from 'supertest';
import { Server } from 'http';

describe('Cross-User Interactions E2E Tests', () => {
  let testEnv: {
    app: Express.Application;
    server: Server;
    request: request.SuperTest<request.Test>;
    cleanup: () => Promise<void>;
  };
  
  let travelerUser: { user: any; token: string };
  let requesterUser: { user: any; token: string };
  let unauthorizedUser: { user: any; token: string };
  let testLocation: any;
  let testTrip: any;
  let testRequest: any;
  
  beforeAll(async () => {
    testEnv = await setupTestServer();
    
    // Create test users
    travelerUser = await createTestUser(testEnv.request, {
      email: 'traveler2@example.com',
      password: 'Password123!',
      name: 'Test Traveler 2',
      phone: '+15551234568'
    });
    
    requesterUser = await createTestUser(testEnv.request, {
      email: 'requester2@example.com',
      password: 'Password123!',
      name: 'Test Requester 2',
      phone: '+15557654322'
    });
    
    unauthorizedUser = await createTestUser(testEnv.request, {
      email: 'unauthorized@example.com',
      password: 'Password123!',
      name: 'Unauthorized User',
      phone: '+15559876543'
    });
    
    // Create test location
    testLocation = await createTestLocation(testEnv.request, travelerUser.token, {
      name: 'Test Electronics Store',
      address: {
        street: '789 Tech St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      },
      category: 'ELECTRONICS'
    });
    
    // Create test trip
    testTrip = await createTestTrip(testEnv.request, travelerUser.token, {
      destinationId: testLocation.id,
      departureTime: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
      estimatedReturnTime: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      capacity: 2,
      description: 'Going to electronics store'
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  test('Authorization boundaries between users', async () => {
    // Step 1: Requester creates a delivery request
    testRequest = await createTestRequest(testEnv.request, requesterUser.token, {
      tripId: testTrip.id,
      items: [
        {
          name: 'USB Cable',
          quantity: 1,
          maxPrice: 15.99,
          description: 'USB-C to USB-A, 6ft'
        }
      ],
      deliveryAddress: {
        street: '456 Requester St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      deliveryFee: 7.00,
      specialInstructions: 'Any brand is fine'
    });
    
    // Step 2: Unauthorized user tries to accept the request (should fail)
    const unauthorizedAcceptResponse = await testEnv.request
      .put(`/api/requests/${testRequest.id}/accept`)
      .set('Authorization', `Bearer ${unauthorizedUser.token}`)
      .send();
    
    expect(unauthorizedAcceptResponse.status).toBe(403);
    
    // Step 3: Unauthorized user tries to update trip status (should fail)
    const unauthorizedTripUpdateResponse = await testEnv.request
      .put(`/api/trips/${testTrip.id}/status`)
      .set('Authorization', `Bearer ${unauthorizedUser.token}`)
      .send({ status: 'AT_STORE' });
    
    expect(unauthorizedTripUpdateResponse.status).toBe(403);
    
    // Step 4: Traveler accepts the request (should succeed)
    const acceptResponse = await testEnv.request
      .put(`/api/requests/${testRequest.id}/accept`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send();
    
    expect(acceptResponse.status).toBe(200);
    
    // Step 5: Requester tries to update trip status (should fail)
    const requesterTripUpdateResponse = await testEnv.request
      .put(`/api/trips/${testTrip.id}/status`)
      .set('Authorization', `Bearer ${requesterUser.token}`)
      .send({ status: 'AT_STORE' });
    
    expect(requesterTripUpdateResponse.status).toBe(403);
    
    // Step 6: Test messaging between users
    const sendMessageResponse = await testEnv.request
      .post('/api/messages')
      .set('Authorization', `Bearer ${requesterUser.token}`)
      .send({
        recipientId: travelerUser.user.id,
        content: 'Hi, please make sure the USB cable is braided',
        requestId: testRequest.id
      });
    
    expect(sendMessageResponse.status).toBe(200);
    expect(sendMessageResponse.body.id).toBeDefined();
    
    // Step 7: Traveler retrieves messages
    const getMessagesResponse = await testEnv.request
      .get(`/api/messages/request/${testRequest.id}`)
      .set('Authorization', `Bearer ${travelerUser.token}`);
    
    expect(getMessagesResponse.status).toBe(200);
    expect(getMessagesResponse.body.length).toBeGreaterThan(0);
    expect(getMessagesResponse.body[0].content).toBe('Hi, please make sure the USB cable is braided');
    
    // Step 8: Unauthorized user tries to read messages (should fail)
    const unauthorizedMessagesResponse = await testEnv.request
      .get(`/api/messages/request/${testRequest.id}`)
      .set('Authorization', `Bearer ${unauthorizedUser.token}`);
    
    expect(unauthorizedMessagesResponse.status).toBe(403);
    
    // Step 9: Traveler updates request status
    const updateStatusResponse = await testEnv.request
      .put(`/api/requests/${testRequest.id}/status`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send({ 
        status: 'PURCHASED',
        receipt: {
          items: [
            { name: 'USB Cable', price: 12.99, quantity: 1 }
          ],
          total: 12.99,
          receiptImageUrl: 'https://example.com/receipt2.jpg'
        }
      });
    
    expect(updateStatusResponse.status).toBe(200);
    
    // Step 10: Requester can view request status
    const requestStatusResponse = await testEnv.request
      .get(`/api/requests/${testRequest.id}`)
      .set('Authorization', `Bearer ${requesterUser.token}`);
    
    expect(requestStatusResponse.status).toBe(200);
    expect(requestStatusResponse.body.status).toBe('PURCHASED');
    
    // Step 11: Unauthorized user tries to view request details (should fail or return limited info)
    const unauthorizedRequestResponse = await testEnv.request
      .get(`/api/requests/${testRequest.id}`)
      .set('Authorization', `Bearer ${unauthorizedUser.token}`);
    
    // Either 403 or limited public info
    if (unauthorizedRequestResponse.status === 200) {
      expect(unauthorizedRequestResponse.body.items).toBeUndefined();
      expect(unauthorizedRequestResponse.body.deliveryAddress).toBeUndefined();
    } else {
      expect(unauthorizedRequestResponse.status).toBe(403);
    }
  });
  
  test('Concurrent request handling and capacity management', async () => {
    // Create another requester
    const requester2 = await createTestUser(testEnv.request, {
      email: 'requester3@example.com',
      password: 'Password123!',
      name: 'Test Requester 3',
      phone: '+15557654323'
    });
    
    // Create first request (we already have one from previous test)
    // Create second request that should fill capacity
    const request2 = await createTestRequest(testEnv.request, requester2.token, {
      tripId: testTrip.id,
      items: [
        {
          name: 'Headphones',
          quantity: 1,
          maxPrice: 49.99,
          description: 'Wireless headphones'
        }
      ],
      deliveryAddress: {
        street: '789 Another St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345'
      },
      deliveryFee: 8.00,
      specialInstructions: 'Prefer black color'
    });
    
    // Accept second request
    await testEnv.request
      .put(`/api/requests/${request2.id}/accept`)
      .set('Authorization', `Bearer ${travelerUser.token}`)
      .send();
    
    // Create third requester
    const requester3 = await createTestUser(testEnv.request, {
      email: 'requester4@example.com',
      password: 'Password123!',
      name: 'Test Requester 4',
      phone: '+15557654324'
    });
    
    // Try to create a third request when capacity is full (should fail)
    const overCapacityResponse = await testEnv.request
      .post('/api/requests')
      .set('Authorization', `Bearer ${requester3.token}`)
      .send({
        tripId: testTrip.id,
        items: [
          {
            name: 'Mouse',
            quantity: 1,
            maxPrice: 29.99,
            description: 'Wireless mouse'
          }
        ],
        deliveryAddress: {
          street: '101 Overflow St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        },
        deliveryFee: 6.00,
        specialInstructions: 'Any brand is fine'
      });
    
    expect(overCapacityResponse.status).toBe(400);
    expect(overCapacityResponse.body.error).toBeDefined();
    
    // Check trip capacity
    const tripResponse = await testEnv.request
      .get(`/api/trips/${testTrip.id}`)
      .set('Authorization', `Bearer ${travelerUser.token}`);
    
    expect(tripResponse.status).toBe(200);
    expect(tripResponse.body.availableCapacity).toBe(0);
  });
});