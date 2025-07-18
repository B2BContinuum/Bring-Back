import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Trip, TripStatus } from '../../../../shared/src/types';

interface TripCardProps {
  trip: Trip & { user?: any };
  onPress: (trip: Trip) => void;
  showUserInfo?: boolean;
  isUserTrip?: boolean;
}

const TripCard: React.FC<TripCardProps> = ({
  trip,
  onPress,
  showUserInfo = true,
  isUserTrip = false,
}) => {
  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: TripStatus): string => {
    switch (status) {
      case TripStatus.ANNOUNCED:
        return '#4caf50'; // Green
      case TripStatus.TRAVELING:
        return '#2196f3'; // Blue
      case TripStatus.AT_DESTINATION:
        return '#ff9800'; // Orange
      case TripStatus.RETURNING:
        return '#9c27b0'; // Purple
      case TripStatus.COMPLETED:
        return '#757575'; // Gray
      case TripStatus.CANCELLED:
        return '#f44336'; // Red
      default:
        return '#757575'; // Gray
    }
  };

  const getStatusText = (status: TripStatus): string => {
    switch (status) {
      case TripStatus.ANNOUNCED:
        return 'Announced';
      case TripStatus.TRAVELING:
        return 'Traveling';
      case TripStatus.AT_DESTINATION:
        return 'At Destination';
      case TripStatus.RETURNING:
        return 'Returning';
      case TripStatus.COMPLETED:
        return 'Completed';
      case TripStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusIcon = (status: TripStatus): string => {
    switch (status) {
      case TripStatus.ANNOUNCED:
        return 'campaign';
      case TripStatus.TRAVELING:
        return 'directions-car';
      case TripStatus.AT_DESTINATION:
        return 'place';
      case TripStatus.RETURNING:
        return 'keyboard-return';
      case TripStatus.COMPLETED:
        return 'check-circle';
      case TripStatus.CANCELLED:
        return 'cancel';
      default:
        return 'help';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderLeftColor: getStatusColor(trip.status) }
      ]}
      onPress={() => onPress(trip)}
    >
      <View style={styles.header}>
        <View style={styles.destinationContainer}>
          <Icon name="store" size={18} color="#555" style={styles.icon} />
          <Text style={styles.destinationText}>{trip.destination.name}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
          <Icon name={getStatusIcon(trip.status)} size={14} color="#fff" />
          <Text style={styles.statusText}>{getStatusText(trip.status)}</Text>
        </View>
      </View>
      
      {showUserInfo && trip.user && (
        <View style={styles.userContainer}>
          <Image
            source={
              trip.user.profileImage
                ? { uri: trip.user.profileImage }
                : require('../../assets/default-avatar.png')
            }
            style={styles.userImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{trip.user.name}</Text>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={14} color="#ffc107" />
              <Text style={styles.ratingText}>
                {trip.user.rating.toFixed(1)} ({trip.user.totalDeliveries} deliveries)
              </Text>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color="#555" style={styles.icon} />
          <Text style={styles.detailText}>
            Departure: {formatDateTime(new Date(trip.departureTime))}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="update" size={16} color="#555" style={styles.icon} />
          <Text style={styles.detailText}>
            Return: {formatDateTime(new Date(trip.estimatedReturnTime))}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="shopping-bag" size={16} color="#555" style={styles.icon} />
          <Text style={styles.detailText}>
            Capacity: {trip.availableCapacity} / {trip.capacity} available
          </Text>
        </View>
        
        {trip.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{trip.description}</Text>
          </View>
        )}
      </View>
      
      {isUserTrip && (
        <View style={styles.userTripBadge}>
          <Text style={styles.userTripText}>Your Trip</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  destinationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  destinationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  detailsContainer: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
  },
  descriptionContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  userTripBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#0066cc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
  },
  userTripText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default TripCard;