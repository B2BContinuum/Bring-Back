import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TripCreationForm from '../../../components/trip/TripCreationForm';
import { TripStatus } from '../../../../../shared/src/types';
import { useLocationSearch } from '../../../hooks/useLocationSearch';

// Mock the useLocationSearch hook
jest.mock('../../../hooks/useLocationSearch', () => ({
  useLocationSearch: jest.fn(),
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  const mockComponent = jest.fn().mockImplementation(({ onChange, value }) => {
    return (
      <div 
        testID="dateTimePicker"
        onPress={(event) => onChange(event, new Date(value.getTime() + 3600000))}
      />
    );
  });
  return mockComponent;
});

// Mock Picker
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  const Picker = ({ children, selectedValue, onValueChange }) => (
    <View testID="picker">
      {React.Children.map(children, child => {
        if (child.props.value === selectedValue) {
          return React.cloneElement(child, { testID: 'selected' });
        }
        return child;
      })}
      <Text testID="pickerValue">{selectedValue}</Text>
      <Text 
        testID="pickerChange" 
        onPress={() => onValueChange(selectedValue + 1)}
      >
        Change
      </Text>
    </View>
  );
  
  Picker.Item = ({ label, value }) => <Text testID={`item-${value}`}>{label}</Text>;
  
  return { Picker };
});

describe('TripCreationForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockUserId = '123';
  
  const mockLocation = {
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
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the useLocationSearch hook implementation
    (useLocationSearch as jest.Mock).mockReturnValue({
      results: {
        locations: [mockLocation],
      },
      searchLocations: jest.fn(),
      searchNearbyLocations: jest.fn(),
    });
  });
  
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <TripCreationForm
        userId={mockUserId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    expect(getByText('Create a Trip')).toBeTruthy();
    expect(getByPlaceholderText('Search for a location')).toBeTruthy();
    expect(getByText('Departure Time')).toBeTruthy();
    expect(getByText('Estimated Return Time')).toBeTruthy();
    expect(getByText('Capacity (how many requests you can handle)')).toBeTruthy();
    expect(getByText('Description (optional)')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Create Trip')).toBeTruthy();
  });
  
  it('shows location search results when typing', async () => {
    const { getByPlaceholderText, findByText } = render(
      <TripCreationForm
        userId={mockUserId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const searchInput = getByPlaceholderText('Search for a location');
    fireEvent.changeText(searchInput, 'Test Store');
    
    // Wait for search results to appear
    const locationName = await findByText('Test Store');
    expect(locationName).toBeTruthy();
  });
  
  it('selects a location when clicked', async () => {
    const { getByPlaceholderText, findByText, getByText } = render(
      <TripCreationForm
        userId={mockUserId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const searchInput = getByPlaceholderText('Search for a location');
    fireEvent.changeText(searchInput, 'Test Store');
    
    // Wait for search results to appear and click on a result
    const locationResult = await findByText('Test Store');
    fireEvent.press(locationResult);
    
    // Check that the selected location is displayed
    expect(getByText('Test Store')).toBeTruthy();
    expect(getByText('123 Test St, Test City, TS')).toBeTruthy();
    expect(getByText('Change Location')).toBeTruthy();
  });
  
  it('calls onCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <TripCreationForm
        userId={mockUserId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
  
  it('shows validation errors when submitting without required fields', () => {
    const { getByText } = render(
      <TripCreationForm
        userId={mockUserId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    const submitButton = getByText('Create Trip');
    fireEvent.press(submitButton);
    
    expect(getByText('Please select a destination')).toBeTruthy();
  });
  
  it('submits the form with correct data when all fields are valid', async () => {
    // Mock current date for consistent testing
    const mockDate = new Date('2025-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);
    
    const { getByPlaceholderText, findByText, getByText } = render(
      <TripCreationForm
        userId={mockUserId}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    // Select a location
    const searchInput = getByPlaceholderText('Search for a location');
    fireEvent.changeText(searchInput, 'Test Store');
    const locationResult = await findByText('Test Store');
    fireEvent.press(locationResult);
    
    // Submit the form
    const submitButton = getByText('Create Trip');
    fireEvent.press(submitButton);
    
    // Check that onSubmit was called with the correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId,
        destination: mockLocation,
        status: TripStatus.ANNOUNCED,
      }));
    });
  });
});