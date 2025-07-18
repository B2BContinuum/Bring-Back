import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { DeliveryRequest, RequestStatus, Trip } from '../../../shared/src/types';
import useRequests from '../hooks/useRequests';
import RequestBrowser from '../components/request/RequestBrowser';
import RequestDetail from '../components/request/RequestDetail';
import RequestCreationForm from '../components/request/RequestCreationForm';

// Mock user ID (in a real app, this would come from authentication)
const MOCK_USER_ID = 'user-123';

const RequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get trip from route params if available (for creating a request for a specific trip)
  const tripFromParams = route.params?.trip as Trip | undefined;
  
  // State
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
  const [isCreatingRequest, setIsCreatingRequest] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'requester' | 'traveler'>('requester');
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(undefined);
  
  // Use the requests hook
  const {
    requests,
    loading,
    error,
    fetchRequests,
    createRequest,
    acceptRequest,
    updateRequestStatus,
    cancelRequest
  } = useRequests(viewMode === 'requester' ? MOCK_USER_ID : undefined, selectedTripId);

  // Effect to handle trip from params
  useEffect(() => {
    if (tripFromParams) {
      setIsCreatingRequest(true);
    }
  }, [tripFromParams]);

  // Handle request selection
  const handleRequestPress = (request: DeliveryRequest) => {
    setSelectedRequest(request);
  };

  // Handle request creation
  const handleCreateRequest = async (requestData: any) => {
    try {
      await createRequest(requestData);
      setIsCreatingRequest(false);
      Alert.alert('Success', 'Your request has been created successfully.');
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert('Error', 'Failed to create request. Please try again.');
    }
  };

  // Handle request acceptance
  const handleAcceptRequest = async (request: DeliveryRequest) => {
    try {
      await acceptRequest(request.id);
      Alert.alert('Success', 'Request accepted successfully.');
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  // Handle request status update
  const handleUpdateStatus = async (requestId: string, status: RequestStatus) => {
    try {
      await updateRequestStatus(requestId, status);
      Alert.alert('Success', `Request status updated to ${status.toLowerCase()}.`);
      
      // If the request is now delivered, go back to the list
      if (status === RequestStatus.DELIVERED) {
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      Alert.alert('Error', 'Failed to update request status. Please try again.');
    }
  };

  // Handle request cancellation
  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(requestId);
              Alert.alert('Success', 'Request cancelled successfully.');
              setSelectedRequest(null);
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert('Error', 'Failed to cancel request. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Toggle between requester and traveler views
  const toggleViewMode = () => {
    setViewMode(viewMode === 'requester' ? 'traveler' : 'requester');
    setSelectedRequest(null);
    setSelectedTripId(undefined);
  };

  // Render content based on current state
  const renderContent = () => {
    if (isCreatingRequest && tripFromParams) {
      return (
        <RequestCreationForm
          trip={tripFromParams}
          userId={MOCK_USER_ID}
          onSubmit={handleCreateRequest}
          onCancel={() => {
            setIsCreatingRequest(false);
            navigation.goBack();
          }}
        />
      );
    }

    if (selectedRequest) {
      return (
        <RequestDetail
          request={selectedRequest}
          isTraveler={viewMode === 'traveler'}
          loading={loading}
          onUpdateStatus={handleUpdateStatus}
          onCancel={handleCancelRequest}
          onBack={() => setSelectedRequest(null)}
        />
      );
    }

    return (
      <>
        <View style={styles.header}>
          <Text style={styles.title}>
            {viewMode === 'requester' ? 'My Requests' : 'Trip Requests'}
          </Text>
          <TouchableOpacity
            style={styles.viewToggleButton}
            onPress={toggleViewMode}
          >
            <Text style={styles.viewToggleText}>
              Switch to {viewMode === 'requester' ? 'Traveler' : 'Requester'} View
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'traveler' && !selectedTripId && (
          <View style={styles.tripSelectContainer}>
            <Text style={styles.tripSelectText}>
              Select a trip to view its requests
            </Text>
            <TouchableOpacity
              style={styles.tripSelectButton}
              onPress={() => navigation.navigate('TripsTab')}
            >
              <Text style={styles.tripSelectButtonText}>Go to Trips</Text>
            </TouchableOpacity>
          </View>
        )}

        <RequestBrowser
          requests={requests}
          loading={loading}
          error={error}
          isTraveler={viewMode === 'traveler'}
          onRefresh={fetchRequests}
          onRequestPress={handleRequestPress}
          onAcceptRequest={handleAcceptRequest}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  viewToggleButton: {
    backgroundColor: '#e8f4f8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16
  },
  viewToggleText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '600'
  },
  tripSelectContainer: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  tripSelectText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8
  },
  tripSelectButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4
  },
  tripSelectButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export default RequestScreen;