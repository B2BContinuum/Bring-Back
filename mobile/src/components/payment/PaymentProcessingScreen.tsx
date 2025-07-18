import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Button } from 'react-native-elements';
import PaymentBreakdown from './PaymentBreakdown';
import PaymentMethodSelector from './PaymentMethodSelector';
import TipSelector from './TipSelector';
import { usePayment } from '../../hooks/usePayment';

interface PaymentProcessingScreenProps {
  requestId: string;
  onPaymentComplete: () => void;
  onCancel: () => void;
  navigation: any;
}

const PaymentProcessingScreen: React.FC<PaymentProcessingScreenProps> = ({
  requestId,
  onPaymentComplete,
  onCancel,
  navigation
}) => {
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [tip, setTip] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const { 
    paymentDetails, 
    loading, 
    error, 
    processPayment, 
    calculateTotal 
  } = usePayment(requestId);

  useEffect(() => {
    // Calculate total with initial tip of 0
    calculateTotal(0);
  }, []);

  const handleTipChange = (tipAmount: number) => {
    setTip(tipAmount);
    calculateTotal(tipAmount);
  };

  const handlePaymentMethodSelect = (paymentMethodId: string) => {
    setSelectedPaymentMethodId(paymentMethodId);
  };

  const handleAddPaymentMethod = () => {
    // Navigate to add payment method screen
    navigation.navigate('AddPaymentMethod', {
      onGoBack: () => {
        // Refresh payment methods when returning
      }
    });
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethodId) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue.');
      return;
    }

    setIsProcessing(true);
    try {
      await processPayment(selectedPaymentMethodId, tip);
      setIsProcessing(false);
      Alert.alert(
        'Payment Successful',
        'Your payment has been processed successfully.',
        [{ text: 'OK', onPress: onPaymentComplete }]
      );
    } catch (error) {
      setIsProcessing(false);
      Alert.alert(
        'Payment Failed',
        `There was an error processing your payment: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button
          title="Try Again"
          onPress={() => calculateTotal(tip)}
          containerStyle={styles.retryButton}
        />
        <Button
          title="Cancel"
          type="outline"
          onPress={onCancel}
          containerStyle={styles.cancelButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Complete Your Payment</Text>
      
      {paymentDetails && (
        <PaymentBreakdown
          itemsCost={paymentDetails.itemsCost}
          deliveryFee={paymentDetails.deliveryFee}
          tip={tip}
          total={paymentDetails.total}
        />
      )}
      
      <TipSelector
        deliveryFee={paymentDetails?.deliveryFee || 0}
        onTipChange={handleTipChange}
      />
      
      <PaymentMethodSelector
        onSelectPaymentMethod={handlePaymentMethodSelect}
        onAddPaymentMethod={handleAddPaymentMethod}
      />
      
      <View style={styles.buttonContainer}>
        <Button
          title="Process Payment"
          onPress={handleProcessPayment}
          disabled={isProcessing || !selectedPaymentMethodId}
          loading={isProcessing}
          containerStyle={styles.payButton}
        />
        <Button
          title="Cancel"
          type="outline"
          onPress={onCancel}
          disabled={isProcessing}
          containerStyle={styles.cancelButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  payButton: {
    marginBottom: 10,
  },
  cancelButton: {
    marginBottom: 20,
  },
  retryButton: {
    marginBottom: 10,
    width: '80%',
  },
});

export default PaymentProcessingScreen;