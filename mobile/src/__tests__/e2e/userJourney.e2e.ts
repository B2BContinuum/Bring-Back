import { device, element, by, waitFor } from 'detox';
import { 
  loginUser, 
  navigateToScreen, 
  createTrip, 
  createRequest, 
  acceptRequest, 
  updateTripStatus, 
  markRequestPurchased, 
  markRequestDelivered, 
  confirmDeliveryAndPay, 
  rateUser 
} from './setup';

describe('User Journey E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete a full trip and delivery journey', async () => {
    // Step 1: Login as traveler
    await loginUser('traveler@example.com', 'password123');
    
    // Step 2: Create a trip
    await createTrip('Grocery Store', '3', 'Going to get groceries');
    
    // Get the trip ID from the screen
    const tripId = await element(by.id('trip-id')).getText();
    
    // Step 3: Logout and login as requester
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();
    
    await loginUser('requester@example.com', 'password123');
    
    // Step 4: Create a request for the trip
    await createRequest(tripId, 'Milk and Bread', '15.00', '5.00');
    
    // Get the request ID from the screen
    const requestId = await element(by.id('request-id')).getText();
    
    // Step 5: Logout and login as traveler again
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();
    
    await loginUser('traveler@example.com', 'password123');
    
    // Step 6: Accept the request
    await acceptRequest(requestId);
    
    // Step 7: Update trip status to AT_STORE
    await updateTripStatus('AT_STORE');
    
    // Step 8: Mark items as purchased
    await markRequestPurchased(requestId, '12.99');
    
    // Step 9: Update trip status to RETURNING
    await updateTripStatus('RETURNING');
    
    // Step 10: Mark request as delivered
    await markRequestDelivered(requestId);
    
    // Step 11: Logout and login as requester
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();
    
    await loginUser('requester@example.com', 'password123');
    
    // Step 12: Confirm delivery and pay
    await confirmDeliveryAndPay(requestId, '3.00');
    
    // Step 13: Rate the traveler
    const travelerId = await element(by.id('traveler-id')).getText();
    await rateUser(travelerId, 5, 'Great service, items delivered as requested');
    
    // Step 14: Logout and login as traveler
    await element(by.id('profile-tab')).tap();
    await element(by.id('logout-button')).tap();
    
    await loginUser('traveler@example.com', 'password123');
    
    // Step 15: Check trip status is completed
    await navigateToScreen('Trip');
    await element(by.id('trip-history-button')).tap();
    
    await waitFor(element(by.id(`trip-card-${tripId}`))).toBeVisible().withTimeout(2000);
    await element(by.id(`trip-card-${tripId}`)).tap();
    
    await expect(element(by.text('COMPLETED'))).toBeVisible();
    
    // Step 16: Rate the requester
    const requesterId = await element(by.id('requester-id')).getText();
    await rateUser(requesterId, 5, 'Great requester, clear instructions');
  });
  
  it('should handle error scenarios gracefully', async () => {
    // Login as traveler
    await loginUser('traveler@example.com', 'password123');
    
    // Try to create a trip with invalid data
    await navigateToScreen('Trip');
    await element(by.id('create-trip-button')).tap();
    
    // Submit without required fields
    await element(by.id('submit-trip-button')).tap();
    
    // Verify error messages are displayed
    await expect(element(by.text('Location is required'))).toBeVisible();
    await expect(element(by.text('Capacity is required'))).toBeVisible();
    
    // Fill in location but with invalid capacity
    await element(by.id('location-search-input')).typeText('Grocery Store');
    await waitFor(element(by.text('Grocery Store'))).toBeVisible().withTimeout(2000);
    await element(by.text('Grocery Store')).tap();
    
    await element(by.id('capacity-input')).typeText('-1');
    await element(by.id('submit-trip-button')).tap();
    
    // Verify capacity error message
    await expect(element(by.text('Capacity must be greater than 0'))).toBeVisible();
    
    // Test network error handling
    // Mock a network error for the API call
    require('../../services/apiClient').post.mockRejectedValueOnce(new Error('Network Error'));
    
    // Fill in valid data
    await element(by.id('capacity-input')).clearText();
    await element(by.id('capacity-input')).typeText('3');
    await element(by.id('description-input')).typeText('Going to get groceries');
    
    await element(by.id('submit-trip-button')).tap();
    
    // Verify error message and retry option
    await expect(element(by.text('Network Error'))).toBeVisible();
    await expect(element(by.id('retry-button'))).toBeVisible();
    
    // Test retry functionality
    require('../../services/apiClient').post.mockResolvedValueOnce({ 
      data: { 
        id: 'test-trip-id',
        status: 'ANNOUNCED'
      } 
    });
    
    await element(by.id('retry-button')).tap();
    
    // Verify success
    await waitFor(element(by.id('trip-detail-screen'))).toBeVisible().withTimeout(2000);
  });
});