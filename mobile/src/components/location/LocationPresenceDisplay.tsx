import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocationPresence } from '../../hooks/useLocationPresence';
import { Location } from '../../types/location.types';
import { getCurrentPosition } from '../../utils/geolocation';

interface LocationPresenceDisplayProps {
  location: Location;
  onCheckInStatusChange?: (isCheckedIn: boolean) => void;
}

const LocationPresenceDisplay: React.FC<LocationPresenceDisplayProps> = ({
  location,
  onCheckInStatusChange,
}) => {
  const {
    isCheckedIn,
    userCount,
    loading,
    error,
    checkIn,
    checkOut,
    fetchUserCount,
  } = useLocationPresence(location.id);

  useEffect(() => {
    fetchUserCount();
    // Set up a refresh interval for real-time updates
    const intervalId = setInterval(fetchUserCount, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchUserCount]);

  useEffect(() => {
    if (onCheckInStatusChange) {
      onCheckInStatusChange(isCheckedIn);
    }
  }, [isCheckedIn, onCheckInStatusChange]);

  const handleCheckIn = async () => {
    try {
      const coordinates = await getCurrentPosition();
      await checkIn(coordinates);
    } catch (error) {
      console.error('Failed to check in:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
    } catch (error) {
      console.error('Failed to check out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.locationName}>{location.name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{location.category}</Text>
        </View>
      </View>
      
      <Text style={styles.addressText}>
        {location.address.street}, {location.address.city}, {location.address.state} {location.address.zipCode}
      </Text>
      
      <View style={styles.presenceContainer}>
        <View style={styles.userCountContainer}>
          <Icon name="people" size={24} color="#0066cc" />
          {loading ? (
            <ActivityIndicator size="small" color="#0066cc" style={styles.loader} testID="presence-loading" />
          ) : (
            <Text style={styles.userCountText}>
              {userCount} {userCount === 1 ? 'person' : 'people'} here now
            </Text>
          )}
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            isCheckedIn ? styles.checkOutButton : styles.checkInButton,
          ]}
          onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
          disabled={loading}
        >
          <Icon
            name={isCheckedIn ? 'logout' : 'login'}
            size={20}
            color="#fff"
          />
          <Text style={styles.actionButtonText}>
            {isCheckedIn ? 'Check Out' : 'Check In'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {isCheckedIn && (
        <View style={styles.checkedInBanner}>
          <Icon name="check-circle" size={16} color="#4CAF50" />
          <Text style={styles.checkedInText}>You are checked in here</Text>
        </View>
      )}
      
      {location.verified && (
        <View style={styles.verifiedBadge}>
          <Icon name="verified" size={16} color="#0066cc" />
          <Text style={styles.verifiedText}>Verified Location</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
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
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  presenceContainer: {
    marginTop: 8,
  },
  userCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userCountText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  loader: {
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  checkInButton: {
    backgroundColor: '#0066cc',
  },
  checkOutButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  checkedInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 4,
    marginTop: 12,
  },
  checkedInText: {
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  verifiedText: {
    color: '#0066cc',
    marginLeft: 4,
    fontSize: 12,
  },
});

export default LocationPresenceDisplay;