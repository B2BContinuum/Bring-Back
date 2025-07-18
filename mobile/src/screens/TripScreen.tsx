import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Trip, TripStatus, TripSearchParams } from '../../../shared/src/types';
import { useTrips } from '../hooks/useTrips';
import { getCurrentPosition } from '../utils/geolocation';
import TripCreationForm from '../components/trip/TripCreationForm';
import TripBrowser from '../components/trip/TripBrowser';
import TripDetail from '../components/trip/TripDetail';

// Temporary user ID for demo purposes
// In a real app, this would come from authentication
const TEMP_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

enum TripScreenMode {
  BROWSE = 'browse',
  CREATE = 'create',
  DETAIL = 'detail',
}

const TripScreen: React.FC = () => {
  const {
    userTrips,
    nearbyTrips,
    selectedTrip,
    isLoading,
    error,
    fetchUserTrips,
    fetchNearbyTrips,
    fetchTripById,
    createTrip,
    updateTripStatus,
    cancelTrip,
  } = useTrips(TEMP_USER_ID);

  const [mode, setMode] = useState<TripScreenMode>(TripScreenMode.BROWSE);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  // Initialize by getting current position and loading trips
  useEffect(() => {
    const initialize = async () => {
      try {
        const position = await getCurrentPosition();
        setCoordinates(position);
        
        // Load nearby trips based on current position
        if (position) {
          const params: TripSearchParams = {
            latitude: position.latitude,
            longitude: position.longitude,
          };
          await fetchNearbyTrips(params);
        }
      } catch (error) {
        console.error('Error initializing trip screen:', error);
        Alert.alert(
          'Location Error',
          'Failed to access your location. Some features may be limited.',
          [{ text: 'OK' }]
        );
      }
    };
    
    initialize();
  }, [fetchNearbyTrips]);

  const handleCreateTrip = async (tripData: Partial<Trip>) => {
    try {
      await createTrip(tripData);
      setMode(TripScreenMode.BROWSE);
      Alert.alert('Success', 'Trip created successfully!');
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'Failed to create trip. Please try again.');
    }
  };

  const handleTripSelect = (trip: Trip) => {
    fetchTripById(trip.id);
    setMode(TripScreenMode.DETAIL);
  };

  const handleStatusUpdate = async (tripId: string, status: TripStatus) => {
    try {
      await updateTripStatus(tripId, status);
      
      if (status === TripStatus.COMPLETED) {
        Alert.alert('Success', 'Trip completed successfully!');
        setMode(TripScreenMode.BROWSE);
      }
    } catch (error) {
      console.error('Error updating trip status:', error);
      Alert.alert('Error', 'Failed to update trip status. Please try again.');
    }
  };

  const handleRefresh = async (params: TripSearchParams) => {
    if (!coordinates) return;
    
    // Merge coordinates with provided params
    const searchParams: TripSearchParams = {
      ...params,
      latitude: params.latitude || coordinates.latitude,
      longitude: params.longitude || coordinates.longitude,
    };
    
    await fetchNearbyTrips(searchParams);
  };

  const renderContent = () => {
    if (isLoading && !nearbyTrips.length && !userTrips.length) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      );
    }

    switch (mode) {
      case TripScreenMode.CREATE:
        return (
          <TripCreationForm
            userId={TEMP_USER_ID}
            onSubmit={handleCreateTrip}
            onCancel={() => setMode(TripScreenMode.BROWSE)}
            isLoading={isLoading}
          />
        );
      
      case TripScreenMode.DETAIL:
        return selectedTrip ? (
          <TripDetail
            trip={selectedTrip}
            isUserTrip={selectedTrip.userId === TEMP_USER_ID}
            onStatusUpdate={handleStatusUpdate}
            onBack={() => setMode(TripScreenMode.BROWSE)}
            isLoading={isLoading}
            onViewRequests={() => {
              // This would navigate to the requests screen in a real app
              Alert.alert('View Requests', 'This would show delivery requests for this trip');
            }}
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Trip not found</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setMode(TripScreenMode.BROWSE)}
            >
              <Text style={styles.backButtonText}>Back to Trips</Text>
            </TouchableOpacity>
          </View>
        );
      
      case TripScreenMode.BROWSE:
      default:
        return (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Trips</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setMode(TripScreenMode.CREATE)}
              >
                <Icon name="add" size={24} color="#fff" />
                <Text style={styles.createButtonText}>Create Trip</Text>
              </TouchableOpacity>
            </View>
            
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}
            
            {userTrips.length > 0 && (
              <View style={styles.yourTripsContainer}>
                <Text style={styles.sectionTitle}>Your Active Trips</Text>
                {userTrips
                  .filter(trip => 
                    trip.status !== TripStatus.COMPLETED && 
                    trip.status !== TripStatus.CANCELLED
                  )
                  .map(trip => (
                    <TouchableOpacity
                      key={trip.id}
                      style={styles.yourTripItem}
                      onPress={() => handleTripSelect(trip)}
                    >
                      <Icon name="directions-car" size={20} color="#0066cc" style={styles.tripIcon} />
                      <Text style={styles.tripName} numberOfLines={1}>
                        {trip.destination.name}
                      </Text>
                      <View style={styles.tripStatusContainer}>
                        <Text style={styles.tripStatusText}>
                          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
            
            <TripBrowser
              trips={nearbyTrips}
              isLoading={isLoading}
              onTripSelect={handleTripSelect}
              onRefresh={handleRefresh}
              currentCoordinates={coordinates || undefined}
              userId={TEMP_USER_ID}
            />
          </>
        );
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorBannerText: {
    color: '#c62828',
    fontSize: 14,
  },
  yourTripsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  yourTripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#cce0ff',
  },
  tripIcon: {
    marginRight: 12,
  },
  tripName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  tripStatusContainer: {
    backgroundColor: '#0066cc',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  tripStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TripScreen;