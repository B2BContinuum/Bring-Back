import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RequestCard from '../../../components/request/RequestCard';
import { DeliveryRequest, RequestStatus } from '../../../../../shared/src/types';

// Mock request data
const mockRequest: DeliveryRequest = {
  id: 'request-123',
  tripId: 'trip-456',
  requesterId: 'user-789',
  items: [
    {
      id: 'item-1',
      name: 'Milk',
      description: '1 gallon',
      quantity: 1,
      estimatedPrice: 3.99
    },
    {
      id: 'item-2',
      name: 'Bread',
      description: 'Whole wheat',
      quantity: 2,
      estimatedPrice: 2.49
    }
  ],
  deliveryAddress: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'USA'
  },
  maxItemBudget: 10,
  deliveryFee: 5,
  status: RequestStatus.PENDING,
  createdAt: new Date(),
};

// Mock functions
const mockOnPress = jest.fn();
const mockOnAccept = jest.fn();

describe('RequestCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with pending status', () => {
    const { getByText } = render(
      <RequestCard
        request={mockRequest}
        onPress={mockOnPress}
      />
    );

    // Check if status is displayed
    expect(getByText('Pending')).toBeTruthy();
    
    // Check if item count is displayed
    expect(getByText('3 items')).toBeTruthy();
    
    // Check if item names are displayed
    expect(getByText('Milk, Bread')).toBeTruthy();
    
    // Check if prices are displayed
    expect(getByText('$8.97')).toBeTruthy(); // 3.99 + (2.49 * 2)
    expect(getByText('$5.00')).toBeTruthy();
    expect(getByText('$13.97')).toBeTruthy(); // 8.97 + 5.00
  });

  it('renders correctly with different status', () => {
    const deliveredRequest = {
      ...mockRequest,
      status: RequestStatus.DELIVERED
    };
    
    const { getByText } = render(
      <RequestCard
        request={deliveredRequest}
        onPress={mockOnPress}
      />
    );

    expect(getByText('Delivered')).toBeTruthy();
  });

  it('shows accept button for travelers with pending requests', () => {
    const { getByText, queryByText } = render(
      <RequestCard
        request={mockRequest}
        isTraveler={true}
        onPress={mockOnPress}
        onAccept={mockOnAccept}
      />
    );

    // Accept button should be visible
    expect(getByText('Accept Request')).toBeTruthy();
    
    // Change status to accepted
    const acceptedRequest = {
      ...mockRequest,
      status: RequestStatus.ACCEPTED
    };
    
    const { queryByText: queryAcceptedText } = render(
      <RequestCard
        request={acceptedRequest}
        isTraveler={true}
        onPress={mockOnPress}
        onAccept={mockOnAccept}
      />
    );
    
    // Accept button should not be visible for non-pending requests
    expect(queryAcceptedText('Accept Request')).toBeNull();
  });

  it('calls onPress when card is pressed', () => {
    const { getByText } = render(
      <RequestCard
        request={mockRequest}
        onPress={mockOnPress}
      />
    );

    fireEvent.press(getByText('Milk, Bread'));
    expect(mockOnPress).toHaveBeenCalledWith(mockRequest);
  });

  it('calls onAccept when accept button is pressed', () => {
    const { getByText } = render(
      <RequestCard
        request={mockRequest}
        isTraveler={true}
        onPress={mockOnPress}
        onAccept={mockOnAccept}
      />
    );

    fireEvent.press(getByText('Accept Request'));
    expect(mockOnAccept).toHaveBeenCalledWith(mockRequest);
  });
});