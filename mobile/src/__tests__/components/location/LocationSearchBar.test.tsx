import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LocationSearchBar from '../../../components/location/LocationSearchBar';
import { useLocationSearch } from '../../../hooks/useLocationSearch';
import { getCurrentPosition } from '../../../utils/geolocation';

// Mock the hooks and utilities
jest.mock('../../../hooks/useLocationSearch');
jest.mock('../../../utils/geolocation');

describe('LocationSearchBar', () => {
  const mockOnLocationSelected = jest.fn();
  const mockSetQuery = jest.fn();
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
      category: 'GROCERY',
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
      category: 'PHARMACY',
      verified: true,
      currentUserCount: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the hook implementation
    (useLocationSearch as jest.Mock).mockReturnValue({
      query: 'grocery',
      setQuery: mockSetQuery,
      results: {
        locations: mockLocations,
        loading: false,
        error: null,
      },
      searchNearbyLocations: mockSearchNearbyLocations,
    });
    
    // Mock getCurrentPosition
    (getCurrentPosition as jest.Mock).mockResolvedValue({
      latitude: 37.7749,
      longitude: -122.4194,
    });
  });

  it('renders correctly', () => {
    const { getByPlaceholderText } = render(
      <LocationSearchBar onLocationSelected={mockOnLocationSelected} />
    );
    
    expect(getByPlaceholderText('Search for stores, pharmacies, etc.')).toBeTruthy();
  });

  it('displays search results when query is entered', async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <LocationSearchBar onLocationSelected={mockOnLocationSelected} />
    );
    
    const searchInput = getByPlaceholderText('Search for stores, pharmacies, etc.');
    fireEvent.changeText(searchInput, 'grocery');
    fireEvent(searchInput, 'submitEditing');
    
    await waitFor(() => {
      expect(getByText('Grocery Store')).toBeTruthy();
      expect(getByText('123 Main St, Anytown')).toBeTruthy();
    });
  });

  it('calls onLocationSelected when a location is selected', async () => {
    const { getByPlaceholderText, getByText } = render(
      <LocationSearchBar onLocationSelected={mockOnLocationSelected} />
    );
    
    const searchInput = getByPlaceholderText('Search for stores, pharmacies, etc.');
    fireEvent.changeText(searchInput, 'grocery');
    fireEvent(searchInput, 'submitEditing');
    
    await waitFor(() => {
      const locationItem = getByText('Grocery Store');
      fireEvent.press(locationItem);
      expect(mockOnLocationSelected).toHaveBeenCalledWith('1');
    });
  });

  it('searches for nearby locations when nearby button is pressed', async () => {
    const { getByText } = render(
      <LocationSearchBar onLocationSelected={mockOnLocationSelected} />
    );
    
    const nearbyButton = getByText('Nearby');
    fireEvent.press(nearbyButton);
    
    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
      expect(mockSearchNearbyLocations).toHaveBeenCalledWith({
        latitude: 37.7749,
        longitude: -122.4194,
      });
    });
  });

  it('clears the search query when clear button is pressed', () => {
    const { getByPlaceholderText } = render(
      <LocationSearchBar onLocationSelected={mockOnLocationSelected} />
    );
    
    const searchInput = getByPlaceholderText('Search for stores, pharmacies, etc.');
    fireEvent.changeText(searchInput, 'grocery');
    
    // Find the clear button by its accessibility role and press it
    const clearButton = searchInput.parent.findByProps({ name: 'clear' });
    fireEvent.press(clearButton);
    
    expect(mockSetQuery).toHaveBeenCalledWith('');
  });

  it('shows loading indicator when results are loading', () => {
    // Mock loading state
    (useLocationSearch as jest.Mock).mockReturnValue({
      query: 'grocery',
      setQuery: mockSetQuery,
      results: {
        locations: [],
        loading: true,
        error: null,
      },
      searchNearbyLocations: mockSearchNearbyLocations,
    });
    
    const { getByPlaceholderText, getByTestId } = render(
      <LocationSearchBar onLocationSelected={mockOnLocationSelected} />
    );
    
    const searchInput = getByPlaceholderText('Search for stores, pharmacies, etc.');
    fireEvent(searchInput, 'submitEditing');
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('shows error message when search fails', () => {
    // Mock error state
    (useLocationSearch as jest.Mock).mockReturnValue({
      query: 'grocery',
      setQuery: mockSetQuery,
      results: {
        locations: [],
        loading: false,
        error: 'Failed to search locations',
      },
      searchNearbyLocations: mockSearchNearbyLocations,
    });
    
    const { getByPlaceholderText, getByText } = render(
      <LocationSearchBar onLocationSelected={mockOnLocationSelected} />
    );
    
    const searchInput = getByPlaceholderText('Search for stores, pharmacies, etc.');
    fireEvent(searchInput, 'submitEditing');
    
    expect(getByText('Failed to search locations')).toBeTruthy();
  });
});