import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Trip, Location, TripStatus } from '../../../../shared/src/types';
import { APP_SETTINGS } from '../../config';
import { useLocationSearch } from '../../hooks/useLocationSearch';

interface TripCreationFormProps {
  userId: string;
  onSubmit: (tripData: Partial<Trip>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const TripCreationForm: React.FC<TripCreationFormProps> = ({
  userId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { results, searchLocations } = useLocationSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [departureTime, setDepartureTime] = useState<Date>(new Date());
  const [returnTime, setReturnTime] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000)); // Default: 2 hours later
  const [capacity, setCapacity] = useState<number>(APP_SETTINGS.DEFAULT_TRIP_CAPACITY);
  const [description, setDescription] = useState<string>('');
  const [showDeparturePicker, setShowDeparturePicker] = useState<boolean>(false);
  const [showReturnPicker, setShowReturnPicker] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle location search
  useEffect(() => {
    if (searchQuery.length > 2) {
      const delaySearch = setTimeout(() => {
        searchLocations(searchQuery);
      }, 500);
      
      return () => clearTimeout(delaySearch);
    }
  }, [searchQuery, searchLocations]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedLocation) {
      newErrors.location = 'Please select a destination';
    }
    
    if (departureTime <= new Date()) {
      newErrors.departureTime = 'Departure time must be in the future';
    }
    
    if (returnTime <= departureTime) {
      newErrors.returnTime = 'Return time must be after departure time';
    }
    
    if (capacity < 1 || capacity > APP_SETTINGS.MAX_TRIP_CAPACITY) {
      newErrors.capacity = `Capacity must be between 1 and ${APP_SETTINGS.MAX_TRIP_CAPACITY}`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a destination');
      return;
    }
    
    try {
      const tripData: Partial<Trip> = {
        userId,
        destination: selectedLocation,
        departureTime,
        estimatedReturnTime: returnTime,
        capacity,
        availableCapacity: capacity,
        status: TripStatus.ANNOUNCED,
        description: description.trim() || undefined,
      };
      
      await onSubmit(tripData);
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    }
  };

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setSearchQuery(location.name);
  };

  const handleDepartureChange = (event: any, selectedDate?: Date) => {
    setShowDeparturePicker(false);
    if (selectedDate) {
      setDepartureTime(selectedDate);
      
      // If return time is before the new departure time, update it
      if (returnTime <= selectedDate) {
        const newReturnTime = new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
        setReturnTime(newReturnTime);
      }
    }
  };

  const handleReturnChange = (event: any, selectedDate?: Date) => {
    setShowReturnPicker(false);
    if (selectedDate) {
      setReturnTime(selectedDate);
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const capacityOptions = Array.from(
    { length: APP_SETTINGS.MAX_TRIP_CAPACITY },
    (_, i) => i + 1
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create a Trip</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Destination</Text>
        <TextInput
          style={styles.input}
          placeholder="Search for a location"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        
        {searchQuery.length > 2 && results.locations.length > 0 && !selectedLocation && (
          <View style={styles.searchResults}>
            {results.locations.map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.searchResultItem}
                onPress={() => handleLocationSelect(location)}
              >
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationAddress}>
                  {location.address.street}, {location.address.city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {selectedLocation && (
          <View style={styles.selectedLocationContainer}>
            <Text style={styles.selectedLocationName}>{selectedLocation.name}</Text>
            <Text style={styles.selectedLocationAddress}>
              {selectedLocation.address.street}, {selectedLocation.address.city}, {selectedLocation.address.state}
            </Text>
            <TouchableOpacity
              style={styles.changeLocationButton}
              onPress={() => {
                setSelectedLocation(null);
                setSearchQuery('');
              }}
            >
              <Text style={styles.changeLocationButtonText}>Change Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Departure Time</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDeparturePicker(true)}
        >
          <Text style={styles.datePickerButtonText}>
            {formatDateTime(departureTime)}
          </Text>
        </TouchableOpacity>
        {errors.departureTime && <Text style={styles.errorText}>{errors.departureTime}</Text>}
        
        {showDeparturePicker && (
          <DateTimePicker
            value={departureTime}
            mode="datetime"
            display="default"
            onChange={handleDepartureChange}
            minimumDate={new Date()}
          />
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Estimated Return Time</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowReturnPicker(true)}
        >
          <Text style={styles.datePickerButtonText}>
            {formatDateTime(returnTime)}
          </Text>
        </TouchableOpacity>
        {errors.returnTime && <Text style={styles.errorText}>{errors.returnTime}</Text>}
        
        {showReturnPicker && (
          <DateTimePicker
            value={returnTime}
            mode="datetime"
            display="default"
            onChange={handleReturnChange}
            minimumDate={departureTime}
          />
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Capacity (how many requests you can handle)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={capacity}
            onValueChange={(itemValue) => setCapacity(Number(itemValue))}
            style={styles.picker}
          >
            {capacityOptions.map((value) => (
              <Picker.Item key={value} label={value.toString()} value={value} />
            ))}
          </Picker>
        </View>
        {errors.capacity && <Text style={styles.errorText}>{errors.capacity}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add any details about your trip"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Trip</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  searchResults: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
  },
  selectedLocationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cce0ff',
  },
  selectedLocationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  changeLocationButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  changeLocationButtonText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '500',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 4,
  },
});

export default TripCreationForm;