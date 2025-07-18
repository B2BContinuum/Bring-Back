import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Trip, TripSearchParams, TripStatus } from '../../../../shared/src/types';
import TripCard from './TripCard';
import { APP_SETTINGS } from '../../config';

interface TripBrowserProps {
  trips: Trip[];
  isLoading: boolean;
  onTripSelect: (trip: Trip) => void;
  onRefresh: (params: TripSearchParams) => Promise<void>;
  currentCoordinates?: { latitude: number; longitude: number };
  userId?: string;
}

const TripBrowser: React.FC<TripBrowserProps> = ({
  trips,
  isLoading,
  onTripSelect,
  onRefresh,
  currentCoordinates,
  userId,
}) => {
  const [searchRadius, setSearchRadius] = useState<number>(APP_SETTINGS.DEFAULT_SEARCH_RADIUS_KM);
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(true);
  const [showWithCapacityOnly, setShowWithCapacityOnly] = useState<boolean>(false);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>(trips);

  // Apply filters when trips or filter settings change
  useEffect(() => {
    let filtered = [...trips];
    
    // Filter by active status if enabled
    if (showActiveOnly) {
      filtered = filtered.filter(trip => 
        trip.status !== TripStatus.COMPLETED && 
        trip.status !== TripStatus.CANCELLED
      );
    }
    
    // Filter by available capacity if enabled
    if (showWithCapacityOnly) {
      filtered = filtered.filter(trip => trip.availableCapacity > 0);
    }
    
    setFilteredTrips(filtered);
  }, [trips, showActiveOnly, showWithCapacityOnly]);

  const handleRefresh = async () => {
    if (!currentCoordinates) return;
    
    const params: TripSearchParams = {
      latitude: currentCoordinates.latitude,
      longitude: currentCoordinates.longitude,
      radius: searchRadius,
    };
    
    await onRefresh(params);
  };

  const handleRadiusChange = (value: string) => {
    const radius = parseInt(value);
    if (!isNaN(radius) && radius > 0 && radius <= APP_SETTINGS.MAX_SEARCH_RADIUS_KM) {
      setSearchRadius(radius);
    }
  };

  const handleApplyFilters = async () => {
    if (!currentCoordinates) return;
    
    const params: TripSearchParams = {
      latitude: currentCoordinates.latitude,
      longitude: currentCoordinates.longitude,
      radius: searchRadius,
    };
    
    await onRefresh(params);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <View style={styles.radiusContainer}>
          <Text style={styles.filterLabel}>Search Radius (km)</Text>
          <TextInput
            style={styles.radiusInput}
            value={searchRadius.toString()}
            onChangeText={handleRadiusChange}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
        
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={styles.filterSwitch}
            onPress={() => setShowActiveOnly(!showActiveOnly)}
          >
            <Icon
              name={showActiveOnly ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color="#0066cc"
            />
            <Text style={styles.switchLabel}>Active trips only</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.filterSwitch}
            onPress={() => setShowWithCapacityOnly(!showWithCapacityOnly)}
          >
            <Icon
              name={showWithCapacityOnly ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color="#0066cc"
            />
            <Text style={styles.switchLabel}>With capacity only</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.applyButton}
          onPress={handleApplyFilters}
          disabled={isLoading}
        >
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      ) : filteredTrips.length > 0 ? (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={onTripSelect}
              isUserTrip={userId === item.userId}
            />
          )}
          refreshing={isLoading}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="directions-car" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Trips Found</Text>
          <Text style={styles.emptyText}>
            {trips.length > 0
              ? 'Try adjusting your filters to see more trips'
              : 'There are no trips available in your area'}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  radiusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  radiusInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  switchContainer: {
    marginBottom: 12,
  },
  filterSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TripBrowser;