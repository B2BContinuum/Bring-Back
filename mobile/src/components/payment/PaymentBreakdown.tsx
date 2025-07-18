import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Divider } from 'react-native-elements';

interface PaymentBreakdownProps {
  itemsCost: number;
  deliveryFee: number;
  tip: number;
  total: number;
  currency?: string;
}

const PaymentBreakdown: React.FC<PaymentBreakdownProps> = ({
  itemsCost,
  deliveryFee,
  tip,
  total,
  currency = 'USD'
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <Card containerStyle={styles.card}>
      <Card.Title>Payment Summary</Card.Title>
      <View style={styles.row}>
        <Text style={styles.label}>Items Total</Text>
        <Text style={styles.value}>{formatCurrency(itemsCost)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Delivery Fee</Text>
        <Text style={styles.value}>{formatCurrency(deliveryFee)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Tip</Text>
        <Text style={styles.value}>{formatCurrency(tip)}</Text>
      </View>
      <Divider style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginVertical: 10,
    padding: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  label: {
    fontSize: 16,
    color: '#555',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
});

export default PaymentBreakdown;