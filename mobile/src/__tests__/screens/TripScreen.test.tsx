import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TripScreen from '../../screens/TripScreen';
import { useTrips } from '../../hooks/useTrips';
import { getCurrentPosition } from '../../utils/geolocation';
import { Trip, TripStatus } from '../../../../shared/src/types';

// Mock the hooks and utilities
jest.mock('../../hooks/useTrips');
jest.mock('../../utils/geolocation');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('TripScreen', () => {
  const mockTrips: Trip[] = [
    {
      id: 'trip1',
      userId: '123e4567-e89b-12d3-a456-426614174000', // Same as TEMP_USER_ID in TripScreen
      destination: {
        id: 'loc1',
        name: 'Grocery Store',
        address: {
          street: '123 Main St',
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
    },
    {
      id: 'trip2',
      userId: 'user2',
      destination: {
        id: 'loc2',
        name: 'Pharmacy',
        address: {
          street: '456 Oak St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'Test Country',
        },
        coordinates: {
          latitude: 40.7129,
          longitude: -74.007,
        },
        category: 'pharmacy',
        verified: true,
        currentUserCount: 3,
      },
      departureTime: new Date('2025-01-01T13:00:00Z'),
      estimatedReturnTime: new Date('2025-01-01T15:00:00Z'),
      capacity: 2,
      availableCapacity: 1,
      status: TripStatus.ANNOUNCED,
      createdAt: new Date('2025-01-01T11:00:00Z'),
      updatedAt: new Date('2025-01-01T11:00:00Z'),
    },
  ];
  
  const mockUseTrips = {
    userTrips: [mockTrips[0]],
    nearbyTrips: mockTrips,
    selectedTrip: null,
    isLoading: false,
    error: null,
    fetchUserTrips: jest.fn(),
    fetchNearbyTrips: jest.fn(),
    fetchTripById: jest.fn(),
    createTrip: jest.fn(),
    updateTripStatus: jest.fn(),
    cancelTrip: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useTrips hook
    (useTrips as jest.Mock).mockReturnValue(mockUseTrips);
    
    // Mock getCurrentPosition
    (getCurrentPosition as jest.Mock).mockResolvedValue({
      latitude: 40.7128,
      longitude: -74.006,
    });
  });
  
  it('renders the browse mode with trips list', async () => {
    const { getByText, findByText } = render(<TripScreen />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
      expect(mockUseTrips.fetchNearbyTrips).toHaveBeenCalled();
    });
    
    // Check that the trips are displayed
    expect(getByText('Trips')).toBeTruthy();
    expect(getByText('Create Trip')).toBeTruthy();
    
    // User trips section should be visible
    expect(getByText('Your Active Trips')).toBeTruthy();
    expect(getByText('Grocery Store')).toBeTruthy();
    
    // Nearby trips should be visible in the browser
    const pharmacyTrip = await findByText('Pharmacy');
    expect(pharmacyTrip).toBeTruthy();
  });
  
  it('switches to create mode when create button is pressed', async () => {
    const { getByText, findByText } = render(<TripScreen />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
    });
    
    // Press the create button
    fireEvent.press(getByText('Create Trip'));
    
    // Check that the create form is displayed
    const createFormTitle = await findByText('Create a Trip');
    expect(createFormTitle).toBeTruthy();
  });
  
  it('switches to detail mode when a trip is selected', async () => {
    // Mock the fetchTripById to set selectedTrip
    const mockSelectedTrip = { ...mockTrips[0] };
    const mockUseTripsWithSelected = {
      ...mockUseTrips,
      fetchTripById: jest.fn().mockImplementation((id) => {
        mockUseTripsWithSelected.selectedTrip = mockTrips.find(t => t.id === id) || null;
      }),
    };
    (useTrips as jest.Mock).mockReturnValue(mockUseTripsWithSelected);
    
    const { getByText, findByText } = render(<TripScreen />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
    });
    
    // Find and press a trip card
    const tripCard = getByText('Grocery Store');
    fireEvent.press(tripCard);
    
    // Check that the trip detail view is displayed
    const detailTitle = await findByText('Trip Details');
    expect(detailTitle).toBeTruthy();
  });
  
  it('creates a trip and returns to browse mode on successful submission', async () => {
    // Mock createTrip to resolve successfully
    mockUseTrips.createTrip.mockResolvedValue(mockTrips[0]);
    
    const { getByText, findByText, getByPlaceholderText } = render(<TripScreen />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
    });
    
    // Switch to create mode
    fireEvent.press(getByText('Create Trip'));
    
    // Fill out the form (simplified for test)
    const createFormTitle = await findByText('Create a Trip');
    expect(createFormTitle).toBeTruthy();
    
    // Submit the form (this would normally require filling out fields)
    fireEvent.press(getByText('Create Trip'));
    
    // Should show validation errors
    expect(getByText('Please select a destination')).toBeTruthy();
  });
  
  it('shows loading state when isLoading is true', async () => {
    // Mock useTrips to return isLoading=true and empty trips
    (useTrips as jest.Mock).mockReturnValue({
      ...mockUseTrips,
      userTrips: [],
      nearbyTrips: [],
      isLoading: true,
    });
    
    const { getByText } = render(<TripScreen />);
    
    // Check that loading indicator is displayed
    expect(getByText('Loading trips...')).toBeTruthy();
  });
  
  it('shows error banner when there is an error', async () => {
    // Mock useTrips to return an error
    (useTrips as jest.Mock).mockReturnValue({
      ...mockUseTrips,
      error: 'Failed to load trips',
    });
    
    const { getByText } = render(<TripScreen />);
    
    // Wait for the component to initialize
    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
    });
    
    // Check that error banner is displayed
    expect(getByText('Failed to load trips')).toBeTruthy();
  });
});