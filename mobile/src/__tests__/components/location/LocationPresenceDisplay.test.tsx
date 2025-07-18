import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LocationPresenceDisplay from '../../../components/location/LocationPresenceDisplay';
import { useLocationPresence } from '../../../hooks/useLocationPresence';
import { getCurrentPosition } from '../../../utils/geolocation';
import { LocationCategory } from '../../../types/location.types';

// Mock the hooks and utilities
jest.mock('../../../hooks/useLocationPresence');
jest.mock('../../../utils/geolocation');

describe('LocationPresenceDisplay', () => {
  const mockOnCheckInStatusChange = jest.fn();
  const mockFetchUserCount = jest.fn();
  const mockCheckIn = jest.fn();
  const mockCheckOut = jest.fn();
  
  const mockLocation = {
    id: '1',
    name: 'Grocery Store',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA',
    },
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
    category: LocationCategory.GROCERY,
    verified: true,
    currentUserCount: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock the hook implementation
    (useLocationPresence as jest.Mock).mockReturnValue({
      isCheckedIn: false,
      userCount: 5,
      loading: false,
      error: null,
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      fetchUserCount: mockFetchUserCount,
    });
    
    // Mock getCurrentPosition
    (getCurrentPosition as jest.Mock).mockResolvedValue({
      latitude: 37.7749,
      longitude: -122.4194,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with location data', () => {
    const { getByText } = render(
      <LocationPresenceDisplay 
        location={mockLocation}
        onCheckInStatusChange={mockOnCheckInStatusChange}
      />
    );
    
    expect(getByText('Grocery Store')).toBeTruthy();
    expect(getByText('123 Main St, Anytown, CA 12345')).toBeTruthy();
    expect(getByText('5 people here now')).toBeTruthy();
    expect(getByText('Check In')).toBeTruthy();
  });

  it('shows verified badge when location is verified', () => {
    const { getByText } = render(
      <LocationPresenceDisplay location={mockLocation} />
    );
    
    expect(getByText('Verified Location')).toBeTruthy();
  });

  it('fetches user count on mount and sets up refresh interval', () => {
    render(<LocationPresenceDisplay location={mockLocation} />);
    
    expect(mockFetchUserCount).toHaveBeenCalledTimes(1);
    
    // Fast-forward time to trigger the interval
    jest.advanceTimersByTime(30000);
    expect(mockFetchUserCount).toHaveBeenCalledTimes(2);
    
    // Fast-forward again
    jest.advanceTimersByTime(30000);
    expect(mockFetchUserCount).toHaveBeenCalledTimes(3);
  });

  it('handles check-in button press', async () => {
    const { getByText } = render(
      <LocationPresenceDisplay 
        location={mockLocation}
        onCheckInStatusChange={mockOnCheckInStatusChange}
      />
    );
    
    const checkInButton = getByText('Check In');
    fireEvent.press(checkInButton);
    
    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
      expect(mockCheckIn).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
      });
    });
  });

  it('shows check-out button when user is checked in', () => {
    // Mock checked-in state
    (useLocationPresence as jest.Mock).mockReturnValue({
      isCheckedIn: true,
      userCount: 5,
      loading: false,
      error: null,
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      fetchUserCount: mockFetchUserCount,
    });
    
    const { getByText, queryByText } = render(
      <LocationPresenceDisplay location={mockLocation} />
    );
    
    expect(getByText('Check Out')).toBeTruthy();
    expect(queryByText('Check In')).toBeNull();
    expect(getByText('You are checked in here')).toBeTruthy();
  });

  it('handles check-out button press', async () => {
    // Mock checked-in state
    (useLocationPresence as jest.Mock).mockReturnValue({
      isCheckedIn: true,
      userCount: 5,
      loading: false,
      error: null,
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      fetchUserCount: mockFetchUserCount,
    });
    
    const { getByText } = render(
      <LocationPresenceDisplay 
        location={mockLocation}
        onCheckInStatusChange={mockOnCheckInStatusChange}
      />
    );
    
    const checkOutButton = getByText('Check Out');
    fireEvent.press(checkOutButton);
    
    await waitFor(() => {
      expect(mockCheckOut).toHaveBeenCalled();
    });
  });

  it('shows loading state', () => {
    // Mock loading state
    (useLocationPresence as jest.Mock).mockReturnValue({
      isCheckedIn: false,
      userCount: 0,
      loading: true,
      error: null,
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      fetchUserCount: mockFetchUserCount,
    });
    
    const { getByTestId } = render(
      <LocationPresenceDisplay location={mockLocation} />
    );
    
    expect(getByTestId('presence-loading')).toBeTruthy();
  });

  it('shows error message when there is an error', () => {
    // Mock error state
    (useLocationPresence as jest.Mock).mockReturnValue({
      isCheckedIn: false,
      userCount: 0,
      loading: false,
      error: 'Failed to fetch location presence',
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      fetchUserCount: mockFetchUserCount,
    });
    
    const { getByText } = render(
      <LocationPresenceDisplay location={mockLocation} />
    );
    
    expect(getByText('Failed to fetch location presence')).toBeTruthy();
  });

  it('calls onCheckInStatusChange when check-in status changes', () => {
    // Mock checked-in state
    (useLocationPresence as jest.Mock).mockReturnValue({
      isCheckedIn: true,
      userCount: 5,
      loading: false,
      error: null,
      checkIn: mockCheckIn,
      checkOut: mockCheckOut,
      fetchUserCount: mockFetchUserCount,
    });
    
    render(
      <LocationPresenceDisplay 
        location={mockLocation}
        onCheckInStatusChange={mockOnCheckInStatusChange}
      />
    );
    
    expect(mockOnCheckInStatusChange).toHaveBeenCalledWith(true);
  });
});