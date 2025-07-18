import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TripCard from '../../../components/trip/TripCard';
import { Trip, TripStatus } from '../../../../../shared/src/types';

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock the require for the default avatar image
jest.mock('../../../assets/default-avatar.png', () => 'default-avatar.png');

describe('TripCard', () => {
  const mockTrip: Trip & { user: any } = {
    id: 'trip123',
    userId: 'user123',
    destination: {
      id: 'loc123',
      name: 'Test Store',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
      },
      coordinates: {
        latitude: 40.7128,
        longitude: -74.006,
      },
      category: 'grocery',
      verified: true,
      currentUserCount: 5,
    },
    departureTime: new Date('2025-01-01T12:00:00Z'),
    estimatedReturnTime: new Date('2025-01-01T14:00:00Z'),
    capacity: 3,
    availableCapacity: 2,
    status: TripStatus.ANNOUNCED,
    description: 'Test trip description',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:00:00Z'),
    user: {
      id: 'user123',
      name: 'Test User',
      rating: 4.5,
      totalDeliveries: 10,
      profileImage: 'https://example.com/profile.jpg',
    },
  };
  
  const mockOnPress = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with all trip details', () => {
    const { getByText } = render(
      <TripCard
        trip={mockTrip}
        onPress={mockOnPress}
        showUserInfo={true}
      />
    );
    
    // Check that trip details are displayed
    expect(getByText('Test Store')).toBeTruthy();
    expect(getByText('Announced')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('4.5 (10 deliveries)')).toBeTruthy();
    expect(getByText(/Departure:/)).toBeTruthy();
    expect(getByText(/Return:/)).toBeTruthy();
    expect(getByText('Capacity: 2 / 3 available')).toBeTruthy();
    expect(getByText('Test trip description')).toBeTruthy();
  });
  
  it('renders without user info when showUserInfo is false', () => {
    const { queryByText } = render(
      <TripCard
        trip={mockTrip}
        onPress={mockOnPress}
        showUserInfo={false}
      />
    );
    
    // User info should not be displayed
    expect(queryByText('Test User')).toBeNull();
    expect(queryByText('4.5 (10 deliveries)')).toBeNull();
    
    // Trip details should still be displayed
    expect(queryByText('Test Store')).toBeTruthy();
    expect(queryByText('Announced')).toBeTruthy();
  });
  
  it('shows "Your Trip" badge when isUserTrip is true', () => {
    const { getByText } = render(
      <TripCard
        trip={mockTrip}
        onPress={mockOnPress}
        isUserTrip={true}
      />
    );
    
    expect(getByText('Your Trip')).toBeTruthy();
  });
  
  it('does not show "Your Trip" badge when isUserTrip is false', () => {
    const { queryByText } = render(
      <TripCard
        trip={mockTrip}
        onPress={mockOnPress}
        isUserTrip={false}
      />
    );
    
    expect(queryByText('Your Trip')).toBeNull();
  });
  
  it('calls onPress with the trip when pressed', () => {
    const { getByText } = render(
      <TripCard
        trip={mockTrip}
        onPress={mockOnPress}
      />
    );
    
    // Press the card
    fireEvent.press(getByText('Test Store').parent);
    
    // Check that onPress was called with the trip
    expect(mockOnPress).toHaveBeenCalledWith(mockTrip);
  });
  
  it('displays different status colors based on trip status', () => {
    // Test with different statuses
    const statuses = [
      { status: TripStatus.ANNOUNCED, text: 'Announced' },
      { status: TripStatus.TRAVELING, text: 'Traveling' },
      { status: TripStatus.AT_DESTINATION, text: 'At Destination' },
      { status: TripStatus.RETURNING, text: 'Returning' },
      { status: TripStatus.COMPLETED, text: 'Completed' },
      { status: TripStatus.CANCELLED, text: 'Cancelled' },
    ];
    
    statuses.forEach(({ status, text }) => {
      const tripWithStatus = { ...mockTrip, status };
      const { getByText } = render(
        <TripCard
          trip={tripWithStatus}
          onPress={mockOnPress}
        />
      );
      
      expect(getByText(text)).toBeTruthy();
    });
  });
});