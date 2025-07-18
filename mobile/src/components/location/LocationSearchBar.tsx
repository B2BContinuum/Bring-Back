import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocationSearch } from '../../hooks/useLocationSearch';
import { getCurrentPosition } from '../../utils/geolocation';

interface LocationSearchBarProps {
  onLocationSelected: (locationId: string) => void;
}

const LocationSearchBar: React.FC<LocationSearchBarProps> = ({ onLocationSelected }) => {
  const { query, setQuery, results, searchNearbyLocations } = useLocationSearch();
  const [showResults, setShowResults] = useState<boolean>(false);

  const handleSearch = () => {
    setShowResults(true);
  };

  const handleLocationSelect = (locationId: string) => {
    onLocationSelected(locationId);
    setShowResults(false);
  };

  const handleNearbySearch = async () => {
    try {
      const coordinates = await getCurrentPosition();
      await searchNearbyLocations(coordinates);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to get current position:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search for stores, pharmacies, etc."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <Icon name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.nearbyButton}
        onPress={handleNearbySearch}
      >
        <Icon name="near-me" size={20} color="#fff" />
        <Text style={styles.nearbyButtonText}>Nearby</Text>
      </TouchableOpacity>

      {showResults && (
        <View style={styles.resultsContainer}>
          {results.loading ? (
            <ActivityIndicator size="small" color="#0066cc" testID="loading-indicator" />
          ) : results.error ? (
            <Text style={styles.errorText}>{results.error}</Text>
          ) : results.locations.length === 0 ? (
            <Text style={styles.noResultsText}>No locations found</Text>
          ) : (
            results.locations.map(location => (
              <TouchableOpacity
                key={location.id}
                style={styles.resultItem}
                onPress={() => handleLocationSelect(location.id)}
              >
                <Text style={styles.locationName}>{location.name}</Text>
                <Text style={styles.locationAddress}>
                  {location.address.street}, {location.address.city}
                </Text>
                <View style={styles.locationInfo}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{location.category}</Text>
                  </View>
                  <View style={styles.userCountContainer}>
                    <Icon name="person" size={16} color="#666" />
                    <Text style={styles.userCountText}>{location.currentUserCount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  nearbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  nearbyButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 10,
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    maxHeight: 300,
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationInfo: {
    flexDirection: 'row',
    marginTop: 5,
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  userCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  userCountText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  errorText: {
    color: 'red',
    padding: 10,
    textAlign: 'center',
  },
  noResultsText: {
    padding: 10,
    textAlign: 'center',
    color: '#666',
  },
});

export default LocationSearchBar;