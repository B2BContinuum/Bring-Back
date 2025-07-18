import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RequestScreen from '../../screens/RequestScreen';
import useRequests from '../../hooks/useRequests';
import { DeliveryRequest, RequestStatus, Trip } from '../../../../shared/src/types';

// Mock the navigation
jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn()
    }),
    useRoute: () => ({
      params: {}
    })
  };
});

// Mock the useRequests hook
jest.mock('../../hooks/useRequests');

// Mock request data
const mockRequests: DeliveryRequest[] = [
  {
    id: 'request-1',
    tripId: 'trip-1',
    requesterId: 'user-1',
    items: [
      {
        id: 'item-1',
        name: 'Milk',
        quantity: 1,
        estimatedPrice: 3.99
      }
    ],
    deliveryAddress: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    },
    maxItemBudget: 5,
    deliveryFee: 3,
    status: RequestStatus.PENDING,
    createdAt: new Date()
  },
  {
    id: 'request-2',
    tripId: 'trip-1',
    requesterId: 'user-2',
    items: [
      {
        id: 'item-2',
        name: 'Bread',
        quantity: 2,
        estimatedPrice: 2.49
      }
    ],
    deliveryAddress: {
      street: '456 Oak St',
      city: 'Othertown',
      state: 'CA',
      zipCode: '54321',
      country: 'USA'
    },
    maxItemBudget: 5,
    deliveryFee: 3,
    status: RequestStatus.ACCEPTED,
    createdAt: new Date(),
    acceptedAt: new Date()
  }
];

describe('RequestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the useRequests hook implementation
    (useRequests as jest.Mock).mockReturnValue({
      requests: mockRequests,
      loading: false,
      error: null,
      fetchRequests: jest.fn(),
      createRequest: jest.fn(),
      acceptRequest: jest.fn(),
      updateRequestStatus: jest.fn(),
      cancelRequest: jest.fn()
    });
  });

  it('renders correctly in requester view', () => {
    const { getByText } = render(<RequestScreen />);
    
    // Check if title is displayed
    expect(getByText('My Requests')).toBeTruthy();
    
    // Check if view toggle button is displayed
    expect(getByText('Switch to Traveler View')).toBeTruthy();
    
    // Check if requests are displayed
    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('Accepted')).toBeTruthy();
  });

  it('toggles between requester and traveler views', () => {
    const { getByText } = render(<RequestScreen />);
    
    // Initially in requester view
    expect(getByText('My Requests')).toBeTruthy();
    
    // Toggle to traveler view
    fireEvent.press(getByText('Switch to Traveler View'));
    
    // Now in traveler view
    expect(getByText('Trip Requests')).toBeTruthy();
    expect(getByText('Switch to Requester View')).toBeTruthy();
    expect(getByText('Select a trip to view its requests')).toBeTruthy();
  });

  it('shows request details when a request is pressed', () => {
    const { getByText, getAllByText } = render(<RequestScreen />);
    
    // Press on a request
    fireEvent.press(getAllByText('Milk')[0]);
    
    // Request details should be displayed
    expect(getByText('Request Details')).toBeTruthy();
    expect(getByText('Back')).toBeTruthy();
  });

  it('goes back to request list when back button is pressed', () => {
    const { getByText, getAllByText } = render(<RequestScreen />);
    
    // Press on a request to show details
    fireEvent.press(getAllByText('Milk')[0]);
    
    // Press back button
    fireEvent.press(getByText('Back'));
    
    // Should be back to the list view
    expect(getByText('My Requests')).toBeTruthy();
  });

  it('shows request creation form when trip is provided in route params', () => {
    // Mock the route with trip params
    jest.mock('@react-navigation/native', () => {
      return {
        useNavigation: () => ({
          navigate: jest.fn(),
          goBack: jest.fn()
        }),
        useRoute: () => ({
          params: {
            trip: {
              id: 'trip-1',
              destination: { name: 'Grocery Store' },
              departureTime: new Date()
            }
          }
        })
      };
    });
    
    // Need to re-render after mocking
    const { getByText } = render(<RequestScreen />);
    
    // Request creation form should be displayed
    expect(getByText('Create Delivery Request')).toBeTruthy();
  });
});