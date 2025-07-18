import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RequestStatus } from '../../../../shared/src/types';

interface RequestStatusTrackerProps {
  status: RequestStatus;
  acceptedAt?: Date;
  completedAt?: Date;
}

const RequestStatusTracker: React.FC<RequestStatusTrackerProps> = ({
  status,
  acceptedAt,
  completedAt
}) => {
  // Define the status steps in order
  const statusSteps = [
    { key: RequestStatus.PENDING, label: 'Pending' },
    { key: RequestStatus.ACCEPTED, label: 'Accepted' },
    { key: RequestStatus.PURCHASED, label: 'Purchased' },
    { key: RequestStatus.DELIVERED, label: 'Delivered' }
  ];

  // Find the current step index
  const currentStepIndex = statusSteps.findIndex(step => step.key === status);
  
  // If cancelled, show a different view
  if (status === RequestStatus.CANCELLED) {
    return (
      <View style={styles.cancelledContainer}>
        <Text style={styles.cancelledText}>This request has been cancelled</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timeline}>
        {statusSteps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isLast = index === statusSteps.length - 1;
          
          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepContainer}>
                <View
                  style={[
                    styles.stepCircle,
                    isActive ? styles.activeStepCircle : styles.inactiveStepCircle
                  ]}
                />
                <Text
                  style={[
                    styles.stepLabel,
                    isActive ? styles.activeStepLabel : styles.inactiveStepLabel
                  ]}
                >
                  {step.label}
                </Text>
                {step.key === RequestStatus.ACCEPTED && acceptedAt && (
                  <Text style={styles.timestamp}>
                    {new Date(acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
                {step.key === RequestStatus.DELIVERED && completedAt && (
                  <Text style={styles.timestamp}>
                    {new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
              
              {!isLast && (
                <View
                  style={[
                    styles.stepLine,
                    index < currentStepIndex
                      ? styles.activeStepLine
                      : styles.inactiveStepLine
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
      
      <View style={styles.statusMessageContainer}>
        <Text style={styles.statusMessage}>
          {getStatusMessage(status)}
        </Text>
      </View>
    </View>
  );
};

// Helper function to get status message
const getStatusMessage = (status: RequestStatus): string => {
  switch (status) {
    case RequestStatus.PENDING:
      return 'Your request is waiting for a traveler to accept it.';
    case RequestStatus.ACCEPTED:
      return 'A traveler has accepted your request and will purchase your items.';
    case RequestStatus.PURCHASED:
      return 'Your items have been purchased and are on the way.';
    case RequestStatus.DELIVERED:
      return 'Your items have been delivered. Thank you for using our service!';
    case RequestStatus.CANCELLED:
      return 'This request has been cancelled.';
    default:
      return '';
  }
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
    elevation: 2
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 4
  },
  activeStepCircle: {
    backgroundColor: '#0066cc'
  },
  inactiveStepCircle: {
    backgroundColor: '#ddd'
  },
  stepLabel: {
    fontSize: 12,
    textAlign: 'center'
  },
  activeStepLabel: {
    color: '#0066cc',
    fontWeight: '600'
  },
  inactiveStepLabel: {
    color: '#999'
  },
  timestamp: {
    fontSize: 10,
    color: '#888',
    marginTop: 2
  },
  stepLine: {
    height: 2,
    flex: 1
  },
  activeStepLine: {
    backgroundColor: '#0066cc'
  },
  inactiveStepLine: {
    backgroundColor: '#ddd'
  },
  statusMessageContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  cancelledContainer: {
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16
  },
  cancelledText: {
    color: '#721c24',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default RequestStatusTracker;