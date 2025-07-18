import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { DeliveryRequest, RequestStatus } from '../../../../shared/src/types';
import RequestCard from './RequestCard';

interface RequestBrowserProps {
  requests: DeliveryRequest[];
  loading: boolean;
  error: string | null;
  isTraveler?: boolean;
  onRefresh: () => void;
  onRequestPress: (request: DeliveryRequest) => void;
  onAcceptRequest?: (request: DeliveryRequest) => Promise<void>;
}

const RequestBrowser: React.FC<RequestBrowserProps> = ({
  requests,
  loading,
  error,
  isTraveler = false,
  onRefresh,
  onRequestPress,
  onAcceptRequest
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Filter requests based on status
  const filteredRequests = requests.filter(request => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') {
      return request.status === RequestStatus.PENDING || 
             request.status === RequestStatus.ACCEPTED || 
             request.status === RequestStatus.PURCHASED;
    }
    if (activeFilter === 'completed') {
      return request.status === RequestStatus.DELIVERED;
    }
    if (activeFilter === 'cancelled') {
      return request.status === RequestStatus.CANCELLED;
    }
    return true;
  });

  // Handle accept request
  const handleAcceptRequest = async (request: DeliveryRequest) => {
    if (onAcceptRequest) {
      await onAcceptRequest(request);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'all' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === 'all' && styles.activeFilterText
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'active' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('active')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === 'active' && styles.activeFilterText
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'completed' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('completed')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === 'completed' && styles.activeFilterText
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'cancelled' && styles.activeFilterButton
          ]}
          onPress={() => setActiveFilter('cancelled')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === 'cancelled' && styles.activeFilterText
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {loading && requests.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {isTraveler
              ? 'No requests found for this trip.'
              : 'You have no delivery requests yet.'}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              isTraveler={isTraveler}
              onPress={onRequestPress}
              onAccept={isTraveler && item.status === RequestStatus.PENDING ? handleAcceptRequest : undefined}
            />
          )}
          refreshing={loading}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8
  },
  activeFilterButton: {
    backgroundColor: '#0066cc'
  },
  filterText: {
    fontSize: 14,
    color: '#666'
  },
  activeFilterText: {
    color: '#fff',
    fontWeight: '600'
  },
  listContent: {
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center'
  },
  refreshButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export default RequestBrowser;