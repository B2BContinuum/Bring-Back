import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';

interface PaymentMethod {
  id: string;
  brand: string;
  last_four: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodSelectorProps {
  onSelectPaymentMethod: (paymentMethodId: string) => void;
  onAddPaymentMethod: () => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onSelectPaymentMethod,
  onAddPaymentMethod
}) => {
  const { paymentMethods, loading, error } = usePaymentMethods();
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);

  useEffect(() => {
    // Auto-select default payment method if available
    if (paymentMethods && paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find(method => method.is_default);
      if (defaultMethod) {
        setSelectedMethodId(defaultMethod.id);
        onSelectPaymentMethod(defaultMethod.id);
      } else {
        setSelectedMethodId(paymentMethods[0].id);
        onSelectPaymentMethod(paymentMethods[0].id);
      }
    }
  }, [paymentMethods]);

  const handleSelectMethod = (id: string) => {
    setSelectedMethodId(id);
    onSelectPaymentMethod(id);
  };

  const getCardIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return 'cc-visa';
      case 'mastercard':
        return 'cc-mastercard';
      case 'amex':
        return 'cc-amex';
      case 'discover':
        return 'cc-discover';
      default:
        return 'credit-card';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={40} color="#ff3b30" />
        <Text style={styles.errorText}>Failed to load payment methods</Text>
        <Button
          title="Try Again"
          type="outline"
          onPress={() => {/* Implement retry logic */}}
          containerStyle={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <Card containerStyle={styles.card}>
      <Card.Title>Payment Method</Card.Title>
      
      {paymentMethods && paymentMethods.length > 0 ? (
        <View>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodItem,
                selectedMethodId === method.id && styles.selectedMethod
              ]}
              onPress={() => handleSelectMethod(method.id)}
            >
              <Icon
                name={getCardIcon(method.brand)}
                type="font-awesome"
                size={24}
                color="#555"
              />
              <View style={styles.methodDetails}>
                <Text style={styles.methodText}>
                  {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• {method.last_four}
                </Text>
                <Text style={styles.expiryText}>
                  Expires {method.exp_month}/{method.exp_year}
                </Text>
              </View>
              {selectedMethodId === method.id && (
                <Icon name="check-circle" size={24} color="#0066cc" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.noMethodsContainer}>
          <Text style={styles.noMethodsText}>No payment methods available</Text>
        </View>
      )}
      
      <Button
        title="Add Payment Method"
        type="outline"
        icon={<Icon name="add" size={16} color="#0066cc" />}
        onPress={onAddPaymentMethod}
        containerStyle={styles.addButton}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginVertical: 10,
    padding: 15,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    color: '#ff3b30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    width: '50%',
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedMethod: {
    borderColor: '#0066cc',
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  methodDetails: {
    flex: 1,
    marginLeft: 15,
  },
  methodText: {
    fontSize: 16,
    fontWeight: '500',
  },
  expiryText: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  noMethodsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noMethodsText: {
    color: '#777',
    fontSize: 16,
  },
  addButton: {
    marginTop: 10,
  },
});

export default PaymentMethodSelector;