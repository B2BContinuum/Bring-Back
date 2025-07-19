import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Button, Icon, Divider } from 'react-native-elements';
import { paymentService } from '../../services/paymentService';

interface TransactionDetailScreenProps {
  route: {
    params: {
      transactionId: string;
    };
  };
  navigation: any;
}

const TransactionDetailScreen: React.FC<TransactionDetailScreenProps> = ({ route, navigation }) => {
  const { transactionId } = route.params;
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactionDetails();
  }, [transactionId]);

  const fetchTransactionDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would fetch the transaction details from the API
      // For this demo, we'll simulate fetching transaction details
      const mockTransaction = {
        id: transactionId,
        type: ['payout', 'delivery_payment', 'refund'][Math.floor(Math.random() * 3)],
        amount: Math.random() * 100 + 5,
        status: ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)],
        created_at: new Date().toISOString(),
        reference_id: `ref_${Math.random().toString(36).substring(2, 10)}`,
        details: {
          request_id: `req_${Math.random().toString(36).substring(2, 10)}`,
          items_cost: Math.random() * 80 + 5,
          delivery_fee: Math.random() * 10 + 2,
          tip: Math.random() * 5,
        }
      };
      
      // Simulate API delay
      setTimeout(() => {
        setTransaction(mockTransaction);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to fetch transaction details');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'payout':
        return { name: 'arrow-downward', color: '#4CAF50' };
      case 'delivery_payment':
        return { name: 'local-shipping', color: '#2196F3' };
      case 'refund':
        return { name: 'replay', color: '#FF9800' };
      default:
        return { name: 'attach-money', color: '#757575' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'payout':
        return 'Payout to Bank Account';
      case 'delivery_payment':
        return 'Delivery Payment';
      case 'refund':
        return 'Refund';
      default:
        return 'Transaction';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading transaction details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={40} color="#ff3b30" />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          title="Try Again"
          type="outline"
          onPress={fetchTransactionDetails}
          containerStyle={styles.retryButton}
        />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={40} color="#ff3b30" />
        <Text style={styles.errorText}>Transaction not found</Text>
        <Button
          title="Go Back"
          type="outline"
          onPress={() => navigation.goBack()}
          containerStyle={styles.retryButton}
        />
      </View>
    );
  }

  const icon = getTransactionIcon(transaction.type);

  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.card}>
        <View style={styles.headerContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
            <Icon name={icon.name} color={icon.color} size={30} />
          </View>
          <Text style={styles.headerText}>{getTransactionTitle(transaction.type)}</Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>
            {transaction.type === 'payout' ? '-' : '+'}{formatCurrency(transaction.amount)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(transaction.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue}>{transaction.id}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(transaction.created_at)}</Text>
          </View>
          
          {transaction.reference_id && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference ID:</Text>
              <Text style={styles.detailValue}>{transaction.reference_id}</Text>
            </View>
          )}
        </View>
        
        {transaction.type === 'delivery_payment' && transaction.details && (
          <>
            <Divider style={styles.divider} />
            
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Items Cost:</Text>
                <Text style={styles.detailValue}>{formatCurrency(transaction.details.items_cost)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Fee:</Text>
                <Text style={styles.detailValue}>{formatCurrency(transaction.details.delivery_fee)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tip:</Text>
                <Text style={styles.detailValue}>{formatCurrency(transaction.details.tip)}</Text>
              </View>
              
              <Divider style={styles.costDivider} />
              
              <View style={styles.detailRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>{formatCurrency(transaction.amount)}</Text>
              </View>
            </View>
          </>
        )}
        
        <Button
          title="Back to Wallet"
          type="outline"
          onPress={() => navigation.goBack()}
          containerStyle={styles.backButton}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    marginTop: 20,
    width: '50%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  costDivider: {
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
  backButton: {
    marginTop: 10,
  },
});

export default TransactionDetailScreen;