import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RequestBrowser from '../../../components/request/RequestBrowser';
import { DeliveryRequest, RequestStatus } from '../../../../../shared/src/types';

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
  },
  {
    id: 'request-3',
    tripId: 'trip-2',
    requesterId: 'user-1',
    items: [
      {
        id: 'item-3',
        name: 'Eggs',
        quantity: 1,
        estimatedPrice: 4.99
      }
    ],
    deliveryAddress: {
      street: '789 Pine St',
      city: 'Somewhere',
      state: 'CA',
      zipCode: '67890',
      country: 'USA'
    },
    maxItemBudget: 5,
    deliveryFee: 3,
    status: RequestStatus.DELIVERED,
    createdAt: new Date(),
    acceptedAt: new Date(),
    completedAt: new Date()
  }
];

// Mock functions
const mockOnRefresh = jest.fn();
const mockOnRequestPress = jest.fn();
const mockOnAcceptRequest = jest.fn();

describe('RequestBrowser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with requests', () => {
    const { getAllByText } = render(
      <RequestBrowser
        requests={mockRequests}
        loading={false}
        error={null}
        onRefresh={mockOnRefresh}
        onRequestPress={mockOnRequestPress}
      />
    );

    // Check if all requests are displayed
    expect(getAllByText(/item/i).length).toBe(3);
  });

  it('renders loading state correctly', () => {
    const { getByText } = render(
      <RequestBrowser
        requests={[]}
        loading={true}
        error={null}
        onRefresh={mockOnRefresh}
        onRequestPress={mockOnRequestPress}
      />
    );

    expect(getByText('Loading requests...')).toBeTruthy();
  });

  it('renders error state correctly', () => {
    const { getByText } = render(
      <RequestBrowser
        requests={[]}
        loading={false}
        error="Failed to load requests"
        onRefresh={mockOnRefresh}
        onRequestPress={mockOnRequestPress}
      />
    );

    expect(getByText('Failed to load requests')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
  });

  it('renders empty state correctly', () => {
    const { getByText } = render(
      <RequestBrowser
        requests={[]}
        loading={false}
        error={null}
        onRefresh={mockOnRefresh}
        onRequestPress={mockOnRequestPress}
      />
    );

    expect(getByText('You have no delivery requests yet.')).toBeTruthy();
    expect(getByText('Refresh')).toBeTruthy();
  });

  it('filters requests correctly', () => {
    const { getByText, queryByText } = render(
      <RequestBrowser
        requests={mockRequests}
        loading={false}
        error={null}
        onRefresh={mockOnRefresh}
        onRequestPress={mockOnRequestPress}
      />
    );

    // Initially all requests should be visible
    expect(queryByText('Pending')).toBeTruthy();
    expect(queryByText('Accepted')).toBeTruthy();
    expect(queryByText('Delivered')).toBeTruthy();
    
    // Filter by active
    fireEvent.press(getByText('Active'));
    
    // Only pending and accepted should be visible
    expect(queryByText('Pending')).toBeTruthy();
    expect(queryByText('Accepted')).toBeTruthy();
    expect(queryByText('Delivered')).toBeNull();
    
    // Filter by completed
    fireEvent.press(getByText('Completed'));
    
    // Only delivered should be visible
    expect(queryByText('Pending')).toBeNull();
    expect(queryByText('Accepted')).toBeNull();
    expect(queryByText('Delivered')).toBeTruthy();
  });

  it('calls onRequestPress when a request is pressed', () => {
    const { getAllByText } = render(
      <RequestBrowser
        requests={mockRequests}
        loading={false}
        error={null}
        onRefresh={mockOnRefresh}
        onRequestPress={mockOnRequestPress}
      />
    );

    // Press the first request
    fireEvent.press(getAllByText('Milk')[0]);
    expect(mockOnRequestPress).toHaveBeenCalledWith(mockRequests[0]);
  });

  it('calls onAcceptRequest when accept button is pressed', () => {
    const { getByText } = render(
      <RequestBrowser
        requests={mockRequests}
        loading={false}
        error={null}
        isTraveler={true}
        onRefresh={mockOnRefresh}
        onRequestPress={mockOnRequestPress}
        onAcceptRequest={mockOnAcceptRequest}
      />
    );

    // Press the accept button on the pending request
    fireEvent.press(getByText('Accept Request'));
    expect(mockOnAcceptRequest).toHaveBeenCalledWith(mockRequests[0]);
  });

  it('calls onRefresh when refresh button is pressed', () => {
    const { getByText } = render(
      <RequestBrowser
        requests={[]}
        loading={false}
        error={null}
        onRefresh={mockOnRefresh}
        onRequestPress={mockOnRequestPress}
      />
    );

    fireEvent.press(getByText('Refresh'));
    expect(mockOnRefresh).toHaveBeenCalled();
  });
});