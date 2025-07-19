import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Card, Button, Icon, Divider } from 'react-native-elements';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';

interface PaymentMethodsScreenProps {
  navigation: any;
}

const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const { 
    paymentMethods, 
    loading, 
    error, 
    fetchPaymentMethods, 
    removePaymentMethod,
    setDefaultPaymentMethod
  } = usePaymentMethods();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPaymentMethods();
    setRefreshing(false);
  };

  const handleAddPaymentMethod = () => {
    navigation.navigate('AddPaymentMethod', {
      onGoBack: () => {
        // Refresh payment methods when returning
        fetchPaymentMethods();
      }
    });
  };

  const handleRemovePaymentMethod = (id: string, brand: string, last_four: string) => {
    Alert.alert(
      'Remove Payment Method',
      `Are you sure you want to remove ${brand} •••• ${last_four}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removePaymentMethod(id);
              Alert.alert('Success', 'Payment method removed successfully');
            } catch (error) {
              Alert.alert('Error', `Failed to remove payment method: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const handleSetDefaultPaymentMethod = async (id: string) => {
    try {
      await setDefaultPaymentMethod(id);
    } catch (error) {
      Alert.alert('Error', `Failed to set default payment method: ${error.message}`);
    }
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

  const renderPaymentMethodItem = ({ item }) => {
    return (
      <View style={styles.paymentMethodItem}>
        <View style={styles.paymentMethodHeader}>
          <View style={styles.paymentMethodInfo}>
            <Icon
              name={getCardIcon(item.brand)}
              type="font-awesome"
              size={24}
              color="#555"
              containerStyle={styles.cardIcon}
            />
            <View>
              <Text style={styles.cardName}>
                {item.brand.charAt(0).toUpperCase() + item.brand.slice(1)} •••• {item.last_four}
              </Text>
              <Text style={styles.expiryText}>
                Expires {item.exp_month}/{item.exp_year}
              </Text>
            </View>
          </View>
          
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          {!item.is_default && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSetDefaultPaymentMethod(item.id)}
            >
              <Icon name="star" size={16} color="#0066cc" />
              <Text style={styles.actionText}>Set as Default</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => handleRemovePaymentMethod(item.id, item.brand, item.last_four)}
          >
            <Icon name="delete" size={16} color="#ff3b30" />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Card.Title>Your Payment Methods</Card.Title>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Icon name="error" size={40} color="#ff3b30" />
            <Text style={styles.errorText}>Failed to load payment methods</Text>
            <Button
              title="Try Again"
              type="outline"
              onPress={fetchPaymentMethods}
              containerStyle={styles.retryButton}
            />
          </View>
        ) : paymentMethods && paymentMethods.length > 0 ? (
          <FlatList
            data={paymentMethods}
            renderItem={renderPaymentMethodItem}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <Divider style={styles.divider} />}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="credit-card" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No payment methods added yet</Text>
          </View>
        )}
        
        <Button
          title="Add Payment Method"
          icon={<Icon name="add" size={16} color="#FFFFFF" containerStyle={styles.buttonIcon} />}
          onPress={handleAddPaymentMethod}
          containerStyle={styles.addButton}
        />
      </Card>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Your payment information is securely stored and encrypted
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
  card: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
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
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    marginTop: 10,
    width: '50%',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  paymentMethodItem: {
    paddingVertical: 15,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 15,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '500',
  },
  expiryText: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  defaultText: {
    color: '#0066cc',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 5,
    color: '#0066cc',
    fontSize: 14,
  },
  removeButton: {
    marginLeft: 'auto',
  },
  removeText: {
    marginLeft: 5,
    color: '#ff3b30',
    fontSize: 14,
  },
  divider: {
    backgroundColor: '#e0e0e0',
  },
  addButton: {
    marginTop: 20,
  },
  buttonIcon: {
    marginRight: 5,
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

export default PaymentMethodsScreen;