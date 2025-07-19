import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Icon, Divider } from 'react-native-elements';

interface PaymentReceiptProps {
  paymentId: string;
  requestId: string;
  itemsCost: number;
  deliveryFee: number;
  tip: number;
  total: number;
  paymentDate: Date;
  paymentMethod: {
    brand: string;
    last_four: string;
  };
  onClose: () => void;
  onRateExperience: () => void;
  currency?: string;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  paymentId,
  requestId,
  itemsCost,
  deliveryFee,
  tip,
  total,
  paymentDate,
  paymentMethod,
  onClose,
  onRateExperience,
  currency = 'USD'
}) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.card}>
        <View style={styles.headerContainer}>
          <Icon
            name="check-circle"
            color="#4CAF50"
            size={60}
            containerStyle={styles.iconContainer}
          />
          <Text style={styles.headerText}>Payment Successful</Text>
          <Text style={styles.subHeaderText}>Thank you for your payment</Text>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment ID:</Text>
            <Text style={styles.detailValue}>{paymentId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request ID:</Text>
            <Text style={styles.detailValue}>{requestId}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(paymentDate)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>
              {paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)} •••• {paymentMethod.last_four}
            </Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.costContainer}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Items Total</Text>
            <Text style={styles.costValue}>{formatCurrency(itemsCost)}</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Delivery Fee</Text>
            <Text style={styles.costValue}>{formatCurrency(deliveryFee)}</Text>
          </View>
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Tip</Text>
            <Text style={styles.costValue}>{formatCurrency(tip)}</Text>
          </View>
          
          <Divider style={styles.costDivider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Rate Your Experience"
            icon={<Icon name="star" size={16} color="#FFFFFF" containerStyle={styles.buttonIcon} />}
            onPress={onRateExperience}
            containerStyle={styles.rateButton}
          />
          
          <Button
            title="Close"
            type="outline"
            onPress={onClose}
            containerStyle={styles.closeButton}
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
    padding: 20,
    margin: 15,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 15,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
  },
  divider: {
    marginVertical: 20,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  costContainer: {
    marginBottom: 20,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  costLabel: {
    fontSize: 16,
    color: '#666',
  },
  costValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  costDivider: {
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
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
  buttonContainer: {
    marginTop: 10,
  },
  rateButton: {
    marginBottom: 10,
  },
  closeButton: {
    marginBottom: 5,
  },
  buttonIcon: {
    marginRight: 5,
  },
});

export default PaymentReceipt;