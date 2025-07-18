import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RequestCreationForm from '../../../components/request/RequestCreationForm';
import { Trip, Location, TripStatus } from '../../../../../shared/src/types';

// Mock trip data
const mockTrip: Trip = {
  id: 'trip-123',
  userId: 'user-456',
  destination: {
    id: 'location-789',
    name: 'Grocery Store',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    },
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    category: 'grocery',
    verified: true,
    currentUserCount: 5
  } as Location,
  departureTime: new Date(),
  estimatedReturnTime: new Date(Date.now() + 3600000),
  capacity: 5,
  availableCapacity: 3,
  status: TripStatus.ANNOUNCED,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock functions
const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

describe('RequestCreationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial values', () => {
    const { getByText, getAllByText } = render(
      <RequestCreationForm
        trip={mockTrip}
        userId="user-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check if the form title is displayed
    expect(getByText('Create Delivery Request')).toBeTruthy();
    
    // Check if the trip destination is displayed
    expect(getByText(/Trip to Grocery Store on/)).toBeTruthy();
    
    // Check if sections are displayed
    expect(getByText('Items')).toBeTruthy();
    expect(getByText('Delivery Address')).toBeTruthy();
    expect(getByText('Delivery Details')).toBeTruthy();
    expect(getByText('Order Summary')).toBeTruthy();
    
    // Check if buttons are displayed
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Submit Request')).toBeTruthy();
  });

  it('allows adding and removing items', () => {
    const { getByText, getAllByText, queryAllByText } = render(
      <RequestCreationForm
        trip={mockTrip}
        userId="user-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Initially there should be one item
    expect(getAllByText('Name').length).toBe(1);
    
    // Add another item
    fireEvent.press(getByText('+ Add Another Item'));
    
    // Now there should be two items
    expect(getAllByText('Name').length).toBe(2);
    
    // Remove the second item
    fireEvent.press(getAllByText('Remove Item')[1]);
    
    // Now there should be one item again
    expect(getAllByText('Name').length).toBe(1);
  });

  it('validates form before submission', async () => {
    const { getByText, getByPlaceholderText } = render(
      <RequestCreationForm
        trip={mockTrip}
        userId="user-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Try to submit without filling required fields
    fireEvent.press(getByText('Submit Request'));
    
    // onSubmit should not be called because validation should fail
    expect(mockOnSubmit).not.toHaveBeenCalled();
    
    // Fill in required fields
    fireEvent.changeText(getByPlaceholderText('Item name'), 'Test Item');
    fireEvent.changeText(getByPlaceholderText('1'), '2');
    fireEvent.changeText(getByPlaceholderText('0.00'), '10.99');
    fireEvent.changeText(getByPlaceholderText('123 Main St'), '456 Elm St');
    fireEvent.changeText(getByPlaceholderText('City'), 'Testville');
    fireEvent.changeText(getByPlaceholderText('State'), 'CA');
    fireEvent.changeText(getByPlaceholderText('12345'), '54321');
    fireEvent.changeText(getByPlaceholderText('Country'), 'USA');
    
    // Submit the form
    fireEvent.press(getByText('Submit Request'));
    
    // Now onSubmit should be called
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        tripId: 'trip-123',
        requesterId: 'user-123',
        items: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Item',
            quantity: 2,
            estimatedPrice: 10.99
          })
        ]),
        deliveryAddress: {
          street: '456 Elm St',
          city: 'Testville',
          state: 'CA',
          zipCode: '54321',
          country: 'USA'
        }
      }));
    });
  });

  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <RequestCreationForm
        trip={mockTrip}
        userId="user-123"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.press(getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});