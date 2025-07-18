import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { DeliveryRequest, RequestStatus } from '../../../../shared/src/types';
import RequestStatusTracker from './RequestStatusTracker';

interface RequestDetailProps {
  request: DeliveryRequest;
  isTraveler?: boolean;
  loading?: boolean;
  onUpdateStatus?: (requestId: string, status: RequestStatus) => Promise<void>;
  onCancel?: (requestId: string) => Promise<void>;
  onBack: () => void;
}

const RequestDetail: React.FC<RequestDetailProps> = ({
  request,
  isTraveler = false,
  loading = false,
  onUpdateStatus,
  onCancel,
  onBack
}) => {
  // Calculate total items and cost
  const totalItems = request.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCost = request.items.reduce(
    (sum, item) => sum + (item.actualPrice || item.estimatedPrice) * item.quantity,
    0
  );

  // Get next status based on current status
  const getNextStatus = (currentStatus: RequestStatus): RequestStatus | null => {
    switch (currentStatus) {
      case RequestStatus.ACCEPTED:
        return RequestStatus.PURCHASED;
      case RequestStatus.PURCHASED:
        return RequestStatus.DELIVERED;
      default:
        return null;
    }
  };

  // Get button text based on current status
  const getActionButtonText = (currentStatus: RequestStatus): string => {
    switch (currentStatus) {
      case RequestStatus.ACCEPTED:
        return 'Mark as Purchased';
      case RequestStatus.PURCHASED:
        return 'Mark as Delivered';
      default:
        return '';
    }
  };

  // Check if the request can be cancelled
  const canCancel = request.status === RequestStatus.PENDING || 
                    request.status === RequestStatus.ACCEPTED;

  // Check if the request can be updated
  const canUpdate = isTraveler && 
                   (request.status === RequestStatus.ACCEPTED || 
                    request.status === RequestStatus.PURCHASED);

  const nextStatus = getNextStatus(request.status);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Request Details</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
      </View>

      <RequestStatusTracker 
        status={request.status} 
        acceptedAt={request.acceptedAt}
        completedAt={request.completedAt}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {request.items.map((item, index) => (
          <View key={item.id || index} style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            </View>
            
            {item.description && (
              <Text style={styles.itemDescription}>{item.description}</Text>
            )}
            
            <View style={styles.itemPriceContainer}>
              <Text style={styles.itemPriceLabel}>Est. Price:</Text>
              <Text style={styles.itemPrice}>
                ${(item.estimatedPrice * item.quantity).toFixed(2)}
              </Text>
            </View>
            
            {item.actualPrice !== undefined && (
              <View style={styles.itemPriceContainer}>
                <Text style={styles.itemPriceLabel}>Actual Price:</Text>
                <Text style={styles.itemPrice}>
                  ${(item.actualPrice * item.quantity).toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>
          {request.deliveryAddress.street}
        </Text>
        <Text style={styles.addressText}>
          {request.deliveryAddress.city}, {request.deliveryAddress.state} {request.deliveryAddress.zipCode}
        </Text>
        <Text style={styles.addressText}>
          {request.deliveryAddress.country}
        </Text>
      </View>

      {request.specialInstructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions</Text>
          <Text style={styles.instructionsText}>{request.specialInstructions}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Summary</Text>
        <View style={styles.summaryRow}>
          <Text>Items ({totalItems}):</Text>
          <Text>${totalCost.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Delivery Fee:</Text>
          <Text>${request.deliveryFee.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalText}>Total:</Text>
          <Text style={styles.totalText}>
            ${(totalCost + request.deliveryFee).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {canCancel && onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => onCancel(request.id)}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
        
        {canUpdate && nextStatus && onUpdateStatus && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onUpdateStatus(request.id, nextStatus)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>
                {getActionButtonText(request.status)}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  backButton: {
    fontSize: 16,
    color: '#0066cc'
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333'
  },
  itemContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  itemPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  itemPriceLabel: {
    fontSize: 14,
    color: '#666'
  },
  itemPrice: {
    fontSize: 14,
    color: '#333'
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4
  },
  instructionsText: {
    fontSize: 16,
    color: '#333'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 18
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32
  },
  cancelButton: {
    backgroundColor: '#f8d7da',
    borderRadius: 4,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#721c24',
    fontWeight: '600'
  },
  actionButton: {
    backgroundColor: '#0066cc',
    borderRadius: 4,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export default RequestDetail;