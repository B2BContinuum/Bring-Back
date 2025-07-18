import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Trip, TripStatus } from '../../../../shared/src/types';
import TripStatusTracker from './TripStatusTracker';

interface TripDetailProps {
  trip: Trip & { user?: any };
  isUserTrip: boolean;
  onStatusUpdate: (tripId: string, status: TripStatus) => Promise<void>;
  onViewRequests?: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const TripDetail: React.FC<TripDetailProps> = ({
  trip,
  isUserTrip,
  onStatusUpdate,
  onViewRequests,
  onBack,
  isLoading = false,
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

  const isActiveTrip = 
    trip.status !== TripStatus.COMPLETED && 
    trip.status !== TripStatus.CANCELLED;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Trip Details</Text>
      </View>
      
      <View style={styles.destinationCard}>
        <View style={styles.destinationHeader}>
          <Icon name="store" size={24} color="#0066cc" style={styles.icon} />
          <Text style={styles.destinationName}>{trip.destination.name}</Text>
        </View>
        
        <Text style={styles.destinationAddress}>
          {trip.destination.address.street}, {trip.destination.address.city}, {trip.destination.address.state}
        </Text>
      </View>
      
      {!isUserTrip && trip.user && (
        <View style={styles.userCard}>
          <Text style={styles.sectionTitle}>Trip Creator</Text>
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
                <Icon name="star" size={16} color="#ffc107" />
                <Text style={styles.ratingText}>
                  {trip.user.rating.toFixed(1)} ({trip.user.totalDeliveries} deliveries)
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Trip Details</Text>
        
        <View style={styles.detailRow}>
          <Icon name="schedule" size={20} color="#0066cc" style={styles.icon} />
          <View>
            <Text style={styles.detailLabel}>Departure Time</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(new Date(trip.departureTime))}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="update" size={20} color="#0066cc" style={styles.icon} />
          <View>
            <Text style={styles.detailLabel}>Estimated Return Time</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(new Date(trip.estimatedReturnTime))}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Icon name="shopping-bag" size={20} color="#0066cc" style={styles.icon} />
          <View>
            <Text style={styles.detailLabel}>Capacity</Text>
            <Text style={styles.detailValue}>
              {trip.availableCapacity} of {trip.capacity} available
            </Text>
          </View>
        </View>
        
        {trip.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{trip.description}</Text>
          </View>
        )}
      </View>
      
      <TripStatusTracker
        trip={trip}
        isUserTrip={isUserTrip}
        onStatusUpdate={onStatusUpdate}
        isLoading={isLoading}
      />
      
      {isUserTrip && isActiveTrip && onViewRequests && (
        <TouchableOpacity style={styles.requestsButton} onPress={onViewRequests}>
          <Icon name="list" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.requestsButtonText}>View Delivery Requests</Text>
        </TouchableOpacity>
      )}
      
      {!isUserTrip && isActiveTrip && trip.availableCapacity > 0 && (
        <TouchableOpacity style={styles.requestsButton}>
          <Icon name="add-shopping-cart" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.requestsButtonText}>Create Delivery Request</Text>
        </TouchableOpacity>
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  destinationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  destinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  destinationName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  destinationAddress: {
    fontSize: 16,
    color: '#666',
    marginLeft: 32,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  descriptionContainer: {
    marginTop: 8,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 6,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
  },
  requestsButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  requestsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TripDetail;