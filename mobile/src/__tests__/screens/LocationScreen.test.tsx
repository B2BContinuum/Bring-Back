import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import LocationScreen from '../../screens/LocationScreen';
import { useLocationSearch } from '../../hooks/useLocationSearch';
import { requestLocationPermission, getCurrentPosition } from '../../utils/geolocation';
import { LocationCategory } from '../../types/location.types';

// Mock the hooks and utilities
jest.mock('../../hooks/useLocationSearch');
jest.mock('../../utils/geolocation');

// Mock the components
jest.mock('../../components/location/LocationSearchBar', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ onLocationSelected }) => (
      <View testID="location-search-bar">
        <Text>LocationSearchBar</Text>
        <Text testID="select-location" onPress={() => onLocationSelected('1')}>
          Select Location
        </Text>
      </View>
    ),
  };
});

jest.mock('../../components/location/LocationPresenceDisplay', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ location, onCheckInStatusChange }) => (
      <View testID="location-presence-display">
        <Text>{location.name}</Text>
        <Text testID="check-in-status-change" onPress={() => onCheckInStatusChange && onCheckInStatusChange(true)}>
          Change Check-in Status
        </Text>
      </View>
    ),
  };
});

jest.mock('../../components/location/LocationMap', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ locations, onLocationSelect }) => (
      <View testID="location-map">
        <Text>LocationMap</Text>
        <Text testID="select-map-location" onPress={() => onLocationSelect(locations[0])}>
          Select Map Location
        </Text>
      </View>
    ),
  };
});

describe('LocationScreen', () => {
  const mockSearchNearbyLocations = jest.fn();
  
  const mockLocations = [
    {
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
    },
    {
      id: '2',
      name: 'Pharmacy',
      address: {
        street: '456 Oak Ave',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA',
      },
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      category: LocationCategory.PHARMACY,
      verified: true,
      currentUserCount: 12,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the hook implementation
    (useLocationSearch as jest.Mock).mockReturnValue({
      results: {
        locations: mockLocations,
        loading: false,
        error: null,
      },
      searchNearbyLocations: mockSearchNearbyLocations,
    });
    
    // Mock location permission
    (requestLocationPermission as jest.Mock).mockResolvedValue(true);
    
    // Mock getCurrentPosition
    (getCurrentPosition as jest.Mock).mockResolvedValue({
      latitude: 37.7749,
      longitude: -122.4194,
    });
  });

  it('renders loading state initially', async () => {
    const { getByText } = render(<LocationScreen />);
    
    expect(getByText('Loading locations...')).toBeTruthy();
  });

  it('renders permission error when location permission is denied', async () => {
    // Mock permission denied
    (requestLocationPermission as jest.Mock).mockResolvedValue(false);
    
    const { getByText } = render(<LocationScreen />);
    
    await waitFor(() => {
      expect(getByText('Location Permission Required')).toBeTruthy();
    });
  });

  it('renders location components when permission is granted', async () => {
    const { getByText, getByTestId } = render(<LocationScreen />);
    
    await waitFor(() => {
      expect(getByText('Find Nearby Locations')).toBeTruthy();
      expect(getByTestId('location-search-bar')).toBeTruthy();
      expect(getByTestId('location-map')).toBeTruthy();
    });
    
    expect(requestLocationPermission).toHaveBeenCalled();
    expect(getCurrentPosition).toHaveBeenCalled();
    expect(mockSearchNearbyLocations).toHaveBeenCalledWith({
      latitude: 37.7749,
      longitude: -122.4194,
    });
  });

  it('selects location when a location is selected from search bar', async () => {
    const { getByTestId, getByText } = render(<LocationScreen />);
    
    await waitFor(() => {
      expect(getByTestId('location-search-bar')).toBeTruthy();
    });
    
    fireEvent.press(getByTestId('select-location'));
    
    await waitFor(() => {
      expect(getByText('Selected Location')).toBeTruthy();
      expect(getByText('Grocery Store')).toBeTruthy();
    });
  });

  it('selects location when a location is selected from map', async () => {
    const { getByTestId, getByText } = render(<LocationScreen />);
    
    await waitFor(() => {
      expect(getByTestId('location-map')).toBeTruthy();
    });
    
    fireEvent.press(getByTestId('select-map-location'));
    
    await waitFor(() => {
      expect(getByText('Selected Location')).toBeTruthy();
      expect(getByText('Grocery Store')).toBeTruthy();
    });
  });

  it('handles check-in status changes', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { getByTestId, getByText } = render(<LocationScreen />);
    
    await waitFor(() => {
      expect(getByTestId('location-map')).toBeTruthy();
    });
    
    // First select a location
    fireEvent.press(getByTestId('select-map-location'));
    
    await waitFor(() => {
      expect(getByText('Selected Location')).toBeTruthy();
    });
    
    // Then trigger check-in status change
    fireEvent.press(getByTestId('check-in-status-change'));
    
    expect(consoleSpy).toHaveBeenCalledWith('Check-in status changed:', true);
    
    consoleSpy.mockRestore();
  });

  it('renders nearby locations section', async () => {
    const { getByText, getAllByTestId } = render(<LocationScreen />);
    
    await waitFor(() => {
      expect(getByText('Nearby Locations')).toBeTruthy();
    });
    
    const locationDisplays = getAllByTestId('location-presence-display');
    expect(locationDisplays.length).toBe(mockLocations.length);
  });
});