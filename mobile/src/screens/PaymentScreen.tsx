import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import PaymentProcessingScreen from '../components/payment/PaymentProcessingScreen';

const PaymentScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Extract request ID from route params
  const { requestId } = route.params as { requestId: string };
  
  const handlePaymentComplete = () => {
    // Navigate to the delivery tracking screen or back to the request detail
    navigation.navigate('RequestDetail', { 
      requestId,
      refresh: true
    });
  };
  
  const handleCancel = () => {
    // Go back to previous screen
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <PaymentProcessingScreen
        requestId={requestId}
        onPaymentComplete={handlePaymentComplete}
        onCancel={handleCancel}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
});

export default PaymentScreen;