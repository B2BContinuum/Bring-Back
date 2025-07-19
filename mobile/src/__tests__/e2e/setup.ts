import { device, element, by, waitFor } from 'detox';

// Mock API responses for E2E tests
jest.mock('../../services/apiClient', () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
});

// Mock geolocation
jest.mock('react-native-geolocation-service', () => {
  return {
    getCurrentPosition: jest.fn((success) => {
      success({
        coords: {
          latitude: 37.7749,
          longitude: -122.4194,
          altitude: null,
          accuracy: 5,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    }),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
    stopObserving: jest.fn(),
  };
});

// Helper functions for E2E tests
export const loginUser = async (email: string, password: string) => {
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-button')).tap();
  await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(2000);
};

export const navigateToScreen = async (screenName: string) => {
  await element(by.id(`${screenName.toLowerCase()}-tab`)).tap();
  await waitFor(element(by.id(`${screenName.toLowerCase()}-screen`))).toBeVisible().withTimeout(2000);
};

export const createTrip = async (storeName: string, capacity: string, description: string) => {
  await navigateToScreen('Trip');
  await element(by.id('create-trip-button')).tap();
  
  await element(by.id('location-search-input')).typeText(storeName);
  await waitFor(element(by.text(storeName))).toBeVisible().withTimeout(2000);
  await element(by.text(storeName)).tap();
  
  await element(by.id('capacity-input')).typeText(capacity);
  await element(by.id('description-input')).typeText(description);
  
  await element(by.id('submit-trip-button')).tap();
  await waitFor(element(by.id('trip-detail-screen'))).toBeVisible().withTimeout(2000);
};

export const createRequest = async (tripId: string, itemName: string, itemPrice: string, deliveryFee: string) => {
  await navigateToScreen('Request');
  await element(by.id('browse-trips-button')).tap();
  
  await waitFor(element(by.id(`trip-card-${tripId}`))).toBeVisible().withTimeout(2000);
  await element(by.id(`trip-card-${tripId}`)).tap();
  
  await element(by.id('create-request-button')).tap();
  await element(by.id('item-name-input')).typeText(itemName);
  await element(by.id('item-price-input')).typeText(itemPrice);
  await element(by.id('delivery-fee-input')).typeText(deliveryFee);
  
  await element(by.id('submit-request-button')).tap();
  await waitFor(element(by.id('request-detail-screen'))).toBeVisible().withTimeout(2000);
};

export const acceptRequest = async (requestId: string) => {
  await navigateToScreen('Trip');
  await element(by.id('my-trips-button')).tap();
  await element(by.id('active-trip-card')).tap();
  
  await waitFor(element(by.id(`request-card-${requestId}`))).toBeVisible().withTimeout(2000);
  await element(by.id(`accept-request-${requestId}`)).tap();
  
  await waitFor(element(by.text('Request Accepted'))).toBeVisible().withTimeout(2000);
};

export const updateTripStatus = async (status: string) => {
  await navigateToScreen('Trip');
  await element(by.id('my-trips-button')).tap();
  await element(by.id('active-trip-card')).tap();
  
  await element(by.id('update-status-button')).tap();
  await element(by.id(`status-${status.toLowerCase()}`)).tap();
  
  await waitFor(element(by.text(`Status updated to ${status}`))).toBeVisible().withTimeout(2000);
};

export const markRequestPurchased = async (requestId: string, actualPrice: string) => {
  await navigateToScreen('Trip');
  await element(by.id('my-trips-button')).tap();
  await element(by.id('active-trip-card')).tap();
  
  await element(by.id(`request-card-${requestId}`)).tap();
  await element(by.id('mark-purchased-button')).tap();
  
  await element(by.id('actual-price-input')).typeText(actualPrice);
  await element(by.id('upload-receipt-button')).tap();
  // Mock image picker would be triggered here
  
  await element(by.id('confirm-purchase-button')).tap();
  await waitFor(element(by.text('Items Purchased'))).toBeVisible().withTimeout(2000);
};

export const markRequestDelivered = async (requestId: string) => {
  await navigateToScreen('Trip');
  await element(by.id('my-trips-button')).tap();
  await element(by.id('active-trip-card')).tap();
  
  await element(by.id(`request-card-${requestId}`)).tap();
  await element(by.id('mark-delivered-button')).tap();
  
  await element(by.id('upload-proof-button')).tap();
  // Mock image picker would be triggered here
  
  await element(by.id('confirm-delivery-button')).tap();
  await waitFor(element(by.text('Delivery Completed'))).toBeVisible().withTimeout(2000);
};

export const confirmDeliveryAndPay = async (requestId: string, tipAmount: string) => {
  await navigateToScreen('Request');
  await element(by.id('my-requests-button')).tap();
  
  await element(by.id(`request-card-${requestId}`)).tap();
  await element(by.id('confirm-delivery-button')).tap();
  
  await element(by.id('tip-amount-input')).typeText(tipAmount);
  await element(by.id('payment-method-selector')).tap();
  await element(by.text('Credit Card')).tap();
  
  await element(by.id('complete-payment-button')).tap();
  await waitFor(element(by.text('Payment Successful'))).toBeVisible().withTimeout(2000);
};

export const rateUser = async (userId: string, rating: number, comment: string) => {
  await element(by.id('rate-user-button')).tap();
  
  await element(by.id(`star-${rating}`)).tap();
  await element(by.id('rating-comment-input')).typeText(comment);
  
  await element(by.id('submit-rating-button')).tap();
  await waitFor(element(by.text('Rating Submitted'))).toBeVisible().withTimeout(2000);
};