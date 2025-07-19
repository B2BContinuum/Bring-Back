import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';

interface AddPaymentMethodScreenProps {
  navigation: any;
  route: {
    params: {
      onGoBack?: () => void;
    };
  };
}

const AddPaymentMethodScreen: React.FC<AddPaymentMethodScreenProps> = ({ navigation, route }) => {
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [cardholderName, setCardholderName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { addPaymentMethod } = usePaymentMethods();

  const formatCardNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add spaces after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    // Limit to 19 characters (16 digits + 3 spaces)
    return formatted.slice(0, 19);
  };

  const formatExpiryDate = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add slash after first 2 digits
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    
    return digits;
  };

  const handleCardNumberChange = (value: string) => {
    setCardNumber(formatCardNumber(value));
  };

  const handleExpiryDateChange = (value: string) => {
    setExpiryDate(formatExpiryDate(value));
  };

  const handleCvvChange = (value: string) => {
    // Limit to 3-4 digits
    const digits = value.replace(/\D/g, '');
    setCvv(digits.slice(0, 4));
  };

  const validateForm = (): boolean => {
    // Basic validation
    if (cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Invalid Card Number', 'Please enter a valid card number.');
      return false;
    }
    
    if (expiryDate.length < 5) {
      Alert.alert('Invalid Expiry Date', 'Please enter a valid expiry date (MM/YY).');
      return false;
    }
    
    const [month, year] = expiryDate.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      Alert.alert('Card Expired', 'The card expiration date is in the past.');
      return false;
    }
    
    if (cvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter a valid CVV code.');
      return false;
    }
    
    if (!cardholderName.trim()) {
      Alert.alert('Missing Information', 'Please enter the cardholder name.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would create a payment method token via a secure API
      // For this demo, we'll simulate creating a payment method with a mock ID
      const mockPaymentMethodId = `pm_${Math.random().toString(36).substring(2, 15)}`;
      
      await addPaymentMethod(mockPaymentMethodId);
      
      setIsSubmitting(false);
      Alert.alert(
        'Payment Method Added',
        'Your payment method has been added successfully.',
        [{ text: 'OK', onPress: handleGoBack }]
      );
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert(
        'Error',
        `Failed to add payment method: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoBack = () => {
    if (route.params?.onGoBack) {
      route.params.onGoBack();
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.card}>
        <Card.Title>Add Payment Method</Card.Title>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Card Number</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            keyboardType="numeric"
            maxLength={19}
          />
        </View>
        
        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth, styles.marginRight]}>
            <Text style={styles.label}>Expiry Date</Text>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={handleExpiryDateChange}
              placeholder="MM/YY"
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              style={styles.input}
              value={cvv}
              onChangeText={handleCvvChange}
              placeholder="123"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Cardholder Name</Text>
          <TextInput
            style={styles.input}
            value={cardholderName}
            onChangeText={setCardholderName}
            placeholder="John Doe"
          />
        </View>
        
        <View style={styles.securityNote}>
          <Icon name="lock" size={16} color="#666" />
          <Text style={styles.securityText}>
            Your payment information is securely encrypted
          </Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Add Payment Method"
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
            containerStyle={styles.submitButton}
          />
          
          <Button
            title="Cancel"
            type="outline"
            onPress={handleGoBack}
            disabled={isSubmitting}
            containerStyle={styles.cancelButton}
          />
        </View>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  card: {
    borderRadius: 10,
    padding: 15,
    margin: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  marginRight: {
    marginRight: '4%',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  securityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginTop: 10,
  },
  submitButton: {
    marginBottom: 10,
  },
  cancelButton: {
    marginBottom: 5,
  },
});

export default AddPaymentMethodScreen;