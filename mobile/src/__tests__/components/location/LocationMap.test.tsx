import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LocationMap from '../../../components/location/LocationMap';
import { getCurrentPosition } from '../../../utils/geolocation';
import { LocationCategory } from '../../../types/location.types';

// Mock the MapView component from react-native-maps
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');
  const MockMapView = (props) => {
    return <View testID="map-view" {...props} />;
  };
  MockMapView.Marker = (props) => <View testID="map-marker" {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    PROVIDER_GOOGLE: 'google',
  };
});

// Mock the geolocation utility
jest.mock('../../../utils/geolocation');

describe('LocationMap', () => {
  const mockOnLocationSelect = jest.fn();
  
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
    
    // Mock getCurrentPosition
    (getCurrentPosition as jest.Mock).mockResolvedValue({
      latitude: 37.7749,
      longitude: -122.4194,
    });
  });

  it('renders correctly with locations', () => {
    const { getByTestID, getAllByTestId } = render(
      <LocationMap 
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
      />
    );
    
    // Check if the map is rendered
    expect(getByTestID('map-view')).toBeTruthy();
    
    // Check if markers are rendered for each location
    const markers = getAllByTestId('map-marker');
    expect(markers.length).toBe(mockLocations.length);
  });

  it('renders the legend correctly', () => {
    const { getByText } = render(
      <LocationMap 
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
      />
    );
    
    expect(getByText('People Present')).toBeTruthy();
    expect(getByText('0-5 people')).toBeTruthy();
    expect(getByText('6-10 people')).toBeTruthy();
    expect(getByText('10+ people')).toBeTruthy();
  });

  it('calls onLocationSelect when a marker is pressed', () => {
    const { getAllByTestId } = render(
      <LocationMap 
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
      />
    );
    
    const markers = getAllByTestId('map-marker');
    fireEvent.press(markers[0]);
    
    expect(mockOnLocationSelect).toHaveBeenCalledWith(mockLocations[0]);
  });

  it('centers on user location when my-location button is pressed', async () => {
    const mapRef = { current: { animateToRegion: jest.fn() } };
    jest.spyOn(React, 'useRef').mockReturnValue(mapRef);
    
    const { getByTestId } = render(
      <LocationMap 
        locations={mockLocations}
        onLocationSelect={mockOnLocationSelect}
      />
    );
    
    // Wait for the useEffect to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    const myLocationButton = getByTestId('my-location-button');
    fireEvent.press(myLocationButton);
    
    expect(mapRef.current.animateToRegion).toHaveBeenCalledWith({
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  });
});