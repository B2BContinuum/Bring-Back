import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocationSearch } from '../hooks/useLocationSearch';
import { getCurrentPosition } from '../utils/geolocation';
import { requestLocationPermission } from '../utils/geolocation';
import LocationSearchBar from '../components/location/LocationSearchBar';
import LocationPresenceDisplay from '../components/location/LocationPresenceDisplay';
import LocationMap from '../components/location/LocationMap';
import { Location } from '../types/location.types';

const LocationScreen: React.FC = () => {
  const { results, searchNearbyLocations } = useLocationSearch();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const granted = await requestLocationPermission();
        setPermissionGranted(granted);
        
        if (granted) {
          const coordinates = await getCurrentPosition();
          await searchNearbyLocations(coordinates);
        }
      } catch (error) {
        console.error('Error initializing location features:', error);
        Alert.alert(
          'Location Error',
          'Failed to access your location. Some features may be limited.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [searchNearbyLocations]);

  const handleLocationSelected = (locationId: string) => {
    const location = results.locations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
    }
  };

  const handleLocationSelectFromMap = (location: Location) => {
    setSelectedLocation(location);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  if (permissionGranted === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Location Permission Required</Text>
        <Text style={styles.permissionText}>
          This feature requires location permission to show nearby stores and verify check-ins.
          Please enable location permissions in your device settings.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Find Nearby Locations</Text>
      
      <LocationSearchBar onLocationSelected={handleLocationSelected} />
      
      {results.locations.length > 0 && (
        <LocationMap
          locations={results.locations}
          onLocationSelect={handleLocationSelectFromMap}
        />
      )}
      
      {selectedLocation ? (
        <View style={styles.selectedLocationContainer}>
          <Text style={styles.sectionTitle}>Selected Location</Text>
          <LocationPresenceDisplay
            location={selectedLocation}
            onCheckInStatusChange={(isCheckedIn) => {
              // You can handle check-in status changes here if needed
              console.log('Check-in status changed:', isCheckedIn);
            }}
          />
        </View>
      ) : (
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionText}>
            Select a location to view details and check in
          </Text>
        </View>
      )}
      
      {results.locations.length > 0 && (
        <View style={styles.nearbyLocationsContainer}>
          <Text style={styles.sectionTitle}>Nearby Locations</Text>
          {results.locations.map(location => (
            <LocationPresenceDisplay
              key={location.id}
              location={location}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  permissionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedLocationContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  noSelectionContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 16,
  },
  noSelectionText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  nearbyLocationsContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
});

export default LocationScreen;