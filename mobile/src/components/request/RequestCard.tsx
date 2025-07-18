import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DeliveryRequest, RequestStatus } from '../../../../shared/src/types';

interface RequestCardProps {
  request: DeliveryRequest;
  isTraveler?: boolean;
  onPress: (request: DeliveryRequest) => void;
  onAccept?: (request: DeliveryRequest) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({
  request,
  isTraveler = false,
  onPress,
  onAccept
}) => {
  // Calculate total items and cost
  const totalItems = request.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = request.items.reduce(
    (sum, item) => sum + (item.actualPrice || item.estimatedPrice) * item.quantity,
    0
  );

  // Get status color based on request status
  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return '#ffc107'; // Yellow
      case RequestStatus.ACCEPTED:
        return '#17a2b8'; // Blue
      case RequestStatus.PURCHASED:
        return '#28a745'; // Green
      case RequestStatus.DELIVERED:
        return '#6c757d'; // Gray
      case RequestStatus.CANCELLED:
        return '#dc3545'; // Red
      default:
        return '#6c757d'; // Default gray
    }
  };

  // Format status text for display
  const formatStatus = (status: RequestStatus) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(request)}
    >
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(request.status) }
            ]}
          />
          <Text style={styles.statusText}>{formatStatus(request.status)}</Text>
        </View>
        <Text style={styles.date}>
          {new Date(request.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.itemCount}>
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {request.items.map(item => item.name).join(', ')}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Items:</Text>
          <Text style={styles.price}>${totalCost.toFixed(2)}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Fee:</Text>
          <Text style={styles.price}>${request.deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalPrice}>
            ${(totalCost + request.deliveryFee).toFixed(2)}
          </Text>
        </View>
      </View>

      {isTraveler && request.status === RequestStatus.PENDING && onAccept && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => onAccept(request)}
        >
          <Text style={styles.acceptButtonText}>Accept Request</Text>
        </TouchableOpacity>
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
    elevation: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555'
  },
  date: {
    fontSize: 12,
    color: '#888'
  },
  content: {
    marginBottom: 12
  },
  itemCount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333'
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  priceLabel: {
    fontSize: 14,
    color: '#666'
  },
  price: {
    fontSize: 14,
    color: '#333'
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  acceptButton: {
    backgroundColor: '#0066cc',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginTop: 16
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export default RequestCard;