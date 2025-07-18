import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TripStatusTracker from '../../../components/trip/TripStatusTracker';
import { Trip, TripStatus } from '../../../../../shared/src/types';

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('TripStatusTracker', () => {
  const mockTrip: Trip = {
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
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:00:00Z'),
  };
  
  const mockOnStatusUpdate = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly with trip status', () => {
    const { getByText } = render(
      <TripStatusTracker
        trip={mockTrip}
        isUserTrip={true}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    expect(getByText('Trip Status')).toBeTruthy();
    expect(getByText('Announced')).toBeTruthy();
    expect(getByText('Trip has been announced but not started yet')).toBeTruthy();
  });
  
  it('shows status update button for user trips with valid next status', () => {
    const { getByText } = render(
      <TripStatusTracker
        trip={mockTrip}
        isUserTrip={true}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    // For ANNOUNCED status, next status button should be "Start Trip"
    expect(getByText('Start Trip')).toBeTruthy();
  });
  
  it('does not show status update button for non-user trips', () => {
    const { queryByText } = render(
      <TripStatusTracker
        trip={mockTrip}
        isUserTrip={false}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    // Status update button should not be visible
    expect(queryByText('Start Trip')).toBeNull();
  });
  
  it('does not show status update button for completed or cancelled trips', () => {
    const completedTrip = { ...mockTrip, status: TripStatus.COMPLETED };
    const cancelledTrip = { ...mockTrip, status: TripStatus.CANCELLED };
    
    const { queryByText: queryCompletedText } = render(
      <TripStatusTracker
        trip={completedTrip}
        isUserTrip={true}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    const { queryByText: queryCancelledText } = render(
      <TripStatusTracker
        trip={cancelledTrip}
        isUserTrip={true}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    // No update button for completed or cancelled trips
    expect(queryCompletedText('Complete Trip')).toBeNull();
    expect(queryCancelledText('Start Trip')).toBeNull();
  });
  
  it('calls onStatusUpdate with correct next status when update button is pressed', () => {
    const { getByText } = render(
      <TripStatusTracker
        trip={mockTrip}
        isUserTrip={true}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    // Press the update button
    fireEvent.press(getByText('Start Trip'));
    
    // Check that onStatusUpdate was called with the correct next status
    expect(mockOnStatusUpdate).toHaveBeenCalledWith('trip123', TripStatus.TRAVELING);
  });
  
  it('shows cancel button for user trips that are not completed or cancelled', () => {
    const { getByText } = render(
      <TripStatusTracker
        trip={mockTrip}
        isUserTrip={true}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    expect(getByText('Cancel Trip')).toBeTruthy();
  });
  
  it('does not show cancel button for non-user trips', () => {
    const { queryByText } = render(
      <TripStatusTracker
        trip={mockTrip}
        isUserTrip={false}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    expect(queryByText('Cancel Trip')).toBeNull();
  });
  
  it('does not show cancel button for completed or cancelled trips', () => {
    const completedTrip = { ...mockTrip, status: TripStatus.COMPLETED };
    const cancelledTrip = { ...mockTrip, status: TripStatus.CANCELLED };
    
    const { queryByText: queryCompletedText } = render(
      <TripStatusTracker
        trip={completedTrip}
        isUserTrip={true}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    const { queryByText: queryCancelledText } = render(
      <TripStatusTracker
        trip={cancelledTrip}
        isUserTrip={true}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    expect(queryCompletedText('Cancel Trip')).toBeNull();
    expect(queryCancelledText('Cancel Trip')).toBeNull();
  });
  
  it('shows timeline with correct status progression', () => {
    const { getByText } = render(
      <TripStatusTracker
        trip={mockTrip}
        isUserTrip={true}
        onStatusUpdate={mockOnStatusUpdate}
      />
    );
    
    // All statuses should be visible in the timeline
    expect(getByText('Announced')).toBeTruthy();
    expect(getByText('Traveling')).toBeTruthy();
    expect(getByText('At Destination')).toBeTruthy();
    expect(getByText('Returning')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
  });
});