import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Card, Button, Icon, Divider } from 'react-native-elements';
import { useWallet } from '../../hooks/useWallet';

interface WalletScreenProps {
  navigation: any;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    balance, 
    transactions, 
    loading, 
    error, 
    fetchWalletData, 
    requestPayout 
  } = useWallet();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  const handleRequestPayout = async () => {
    try {
      await requestPayout();
      // Show success message or navigate to confirmation screen
    } catch (error) {
      // Handle error
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
      month: 'short',
      day: 'numeric',
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

  const renderTransactionItem = ({ item }) => {
    const icon = getTransactionIcon(item.type);
    
    return (
      <TouchableOpacity 
        style={styles.transactionItem}
        onPress={() => navigation.navigate('TransactionDetail', { transactionId: item.id })}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${icon.color}20` }]}>
          <Icon name={icon.name} color={icon.color} size={24} />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>
            {item.type === 'payout' ? 'Payout' : 
             item.type === 'delivery_payment' ? 'Delivery Payment' : 
             item.type === 'refund' ? 'Refund' : 'Transaction'}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={[
          styles.transactionAmount,
          item.type === 'payout' ? styles.positiveAmount : 
          item.type === 'refund' ? styles.neutralAmount : styles.positiveAmount
        ]}>
          {item.type === 'payout' ? '-' : '+'}{formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading wallet data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balance || 0)}</Text>
        <Button
          title="Request Payout"
          disabled={!balance || balance <= 0}
          onPress={handleRequestPayout}
          containerStyle={styles.payoutButton}
        />
      </Card>

      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load transactions</Text>
            <Button
              title="Try Again"
              type="outline"
              onPress={fetchWalletData}
              containerStyle={styles.retryButton}
            />
          </View>
        ) : transactions && transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider style={styles.divider} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="account-balance-wallet" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Payouts are typically processed within 2-3 business days
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 16,
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
  balanceCard: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 15,
  },
  payoutButton: {
    marginTop: 10,
  },
  transactionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveAmount: {
    color: '#4CAF50',
  },
  negativeAmount: {
    color: '#F44336',
  },
  neutralAmount: {
    color: '#FF9800',
  },
  divider: {
    backgroundColor: '#e0e0e0',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 10,
  },
  retryButton: {
    width: '50%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  infoContainer: {
    padding: 15,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});

export default WalletScreen;