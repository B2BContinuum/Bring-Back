import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import RatingSubmissionForm from '../components/rating/RatingSubmissionForm';

const RatingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Extract params from route
  const { 
    ratedUserId, 
    ratedUserName, 
    deliveryRequestId 
  } = route.params as { 
    ratedUserId: string; 
    ratedUserName: string; 
    deliveryRequestId?: string;
  };
  
  const handleSubmitSuccess = () => {
    // Navigate back to the previous screen or to a confirmation screen
    navigation.goBack();
  };
  
  const handleCancel = () => {
    // Go back without submitting
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <RatingSubmissionForm
          ratedUserId={ratedUserId}
          ratedUserName={ratedUserName}
          deliveryRequestId={deliveryRequestId}
          onSubmitSuccess={handleSubmitSuccess}
          onCancel={handleCancel}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
});

export default RatingScreen;