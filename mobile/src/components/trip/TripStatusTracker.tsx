import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Trip, TripStatus } from '../../../../shared/src/types';

interface TripStatusTrackerProps {
  trip: Trip;
  isUserTrip: boolean;
  onStatusUpdate: (tripId: string, status: TripStatus) => Promise<void>;
  isLoading?: boolean;
}

const TripStatusTracker: React.FC<TripStatusTrackerProps> = ({
  trip,
  isUserTrip,
  onStatusUpdate,
  isLoading = false,
}) => {
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

  const getStatusDescription = (status: TripStatus): string => {
    switch (status) {
      case TripStatus.ANNOUNCED:
        return 'Trip has been announced but not started yet';
      case TripStatus.TRAVELING:
        return 'Currently traveling to the destination';
      case TripStatus.AT_DESTINATION:
        return 'Arrived at the destination';
      case TripStatus.RETURNING:
        return 'Returning from the destination';
      case TripStatus.COMPLETED:
        return 'Trip has been completed';
      case TripStatus.CANCELLED:
        return 'Trip has been cancelled';
      default:
        return '';
    }
  };

  const getNextStatus = (currentStatus: TripStatus): TripStatus | null => {
    switch (currentStatus) {
      case TripStatus.ANNOUNCED:
        return TripStatus.TRAVELING;
      case TripStatus.TRAVELING:
        return TripStatus.AT_DESTINATION;
      case TripStatus.AT_DESTINATION:
        return TripStatus.RETURNING;
      case TripStatus.RETURNING:
        return TripStatus.COMPLETED;
      default:
        return null;
    }
  };

  const getNextStatusText = (currentStatus: TripStatus): string => {
    switch (currentStatus) {
      case TripStatus.ANNOUNCED:
        return 'Start Trip';
      case TripStatus.TRAVELING:
        return 'Arrived at Destination';
      case TripStatus.AT_DESTINATION:
        return 'Start Return Trip';
      case TripStatus.RETURNING:
        return 'Complete Trip';
      default:
        return '';
    }
  };

  const handleStatusUpdate = async (newStatus: TripStatus) => {
    try {
      await onStatusUpdate(trip.id, newStatus);
    } catch (error) {
      console.error('Error updating trip status:', error);
      Alert.alert('Error', 'Failed to update trip status. Please try again.');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this trip? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel Trip',
          style: 'destructive',
          onPress: () => onStatusUpdate(trip.id, TripStatus.CANCELLED),
        },
      ]
    );
  };

  const nextStatus = getNextStatus(trip.status);
  const canUpdateStatus = isUserTrip && nextStatus !== null;
  const canCancel = isUserTrip && 
    trip.status !== TripStatus.COMPLETED && 
    trip.status !== TripStatus.CANCELLED;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Status</Text>
      
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
        <Text style={styles.statusText}>{getStatusText(trip.status)}</Text>
      </View>
      
      <Text style={styles.statusDescription}>
        {getStatusDescription(trip.status)}
      </Text>
      
      <View style={styles.timeline}>
        {Object.values(TripStatus)
          .filter(status => status !== TripStatus.CANCELLED)
          .map((status, index, array) => {
            const isCompleted = 
              Object.values(TripStatus).indexOf(trip.status) >= 
              Object.values(TripStatus).indexOf(status);
            const isLast = index === array.length - 1;
            
            return (
              <React.Fragment key={status}>
                <View style={styles.timelineItem}>
                  <View
                    style={[
                      styles.timelinePoint,
                      isCompleted ? styles.completedPoint : styles.pendingPoint,
                    ]}
                  >
                    {isCompleted && <Icon name="check" size={16} color="#fff" />}
                  </View>
                  <Text
                    style={[
                      styles.timelineText,
                      isCompleted ? styles.completedText : styles.pendingText,
                    ]}
                  >
                    {getStatusText(status as TripStatus)}
                  </Text>
                </View>
                
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      isCompleted ? styles.completedLine : styles.pendingLine,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
      </View>
      
      <View style={styles.actionsContainer}>
        {canUpdateStatus && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => handleStatusUpdate(nextStatus!)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>
                {getNextStatusText(trip.status)}
              </Text>
            )}
          </TouchableOpacity>
        )}
        
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel Trip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  timeline: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelinePoint: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completedPoint: {
    backgroundColor: '#4caf50',
  },
  pendingPoint: {
    backgroundColor: '#e0e0e0',
  },
  timelineText: {
    fontSize: 14,
  },
  completedText: {
    fontWeight: '500',
    color: '#333',
  },
  pendingText: {
    color: '#999',
  },
  timelineLine: {
    width: 2,
    height: 16,
    marginLeft: 11,
    marginVertical: 2,
  },
  completedLine: {
    backgroundColor: '#4caf50',
  },
  pendingLine: {
    backgroundColor: '#e0e0e0',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  updateButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TripStatusTracker;