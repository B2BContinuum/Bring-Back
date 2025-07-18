import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Location, Coordinates } from '../../types/location.types';
import { getCurrentPosition } from '../../utils/geolocation';

interface LocationMapProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  initialRegion?: Region;
}

const LocationMap: React.FC<LocationMapProps> = ({
  locations,
  onLocationSelect,
  initialRegion,
}) => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  );

  useEffect(() => {
    fetchUserLocation();
  }, []);

  const fetchUserLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setUserLocation(position);
      
      if (!initialRegion) {
        setRegion({
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error('Failed to get user location:', error);
    }
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  const getMarkerColor = (location: Location) => {
    // Different colors based on location category or user count
    if (location.currentUserCount > 10) return 'red';
    if (location.currentUserCount > 5) return 'orange';
    return '#0066cc';
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {locations.map(location => (
          <Marker
            key={location.id}
            coordinate={location.coordinates}
            title={location.name}
            description={`${location.currentUserCount} people here now`}
            pinColor={getMarkerColor(location)}
            onPress={() => onLocationSelect(location)}
          />
        ))}
      </MapView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={centerOnUserLocation}
          testID="my-location-button"
        >
          <Icon name="my-location" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>People Present</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#0066cc' }]} />
          <Text style={styles.legendText}>0-5 people</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'orange' }]} />
          <Text style={styles.legendText}>6-10 people</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: 'red' }]} />
          <Text style={styles.legendText}>10+ people</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  myLocationButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  legendContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  legendTitle: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
});

export default LocationMap;