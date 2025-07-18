import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Trip, RequestItem } from '../../../../shared/src/types';
import { DEFAULT_DELIVERY_FEE } from '../../config';

interface RequestCreationFormProps {
  trip: Trip;
  userId: string;
  onSubmit: (requestData: {
    tripId: string;
    requesterId: string;
    items: RequestItem[];
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    maxItemBudget: number;
    deliveryFee: number;
    specialInstructions?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const RequestCreationForm: React.FC<RequestCreationFormProps> = ({
  trip,
  userId,
  onSubmit,
  onCancel
}) => {
  // Form state
  const [items, setItems] = useState<RequestItem[]>([{
    id: `item-${Date.now()}`,
    name: '',
    description: '',
    quantity: 1,
    estimatedPrice: 0
  }]);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE.toString());
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total estimated cost
  const totalEstimatedCost = items.reduce(
    (sum, item) => sum + item.estimatedPrice * item.quantity,
    0
  );

  // Add a new item to the list
  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        name: '',
        description: '',
        quantity: 1,
        estimatedPrice: 0
      }
    ]);
  };

  // Remove an item from the list
  const removeItem = (itemId: string) => {
    if (items.length === 1) {
      Alert.alert('Cannot remove', 'You must have at least one item in your request.');
      return;
    }
    setItems(items.filter(item => item.id !== itemId));
  };

  // Update an item's properties
  const updateItem = (itemId: string, field: keyof RequestItem, value: any) => {
    setItems(
      items.map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        tripId: trip.id,
        requesterId: userId,
        items,
        deliveryAddress: {
          street,
          city,
          state,
          zipCode,
          country
        },
        maxItemBudget: totalEstimatedCost,
        deliveryFee: parseFloat(deliveryFee),
        specialInstructions: specialInstructions.trim() || undefined
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to create request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate the form
  const validateForm = (): boolean => {
    // Check if all items have names and prices
    const invalidItems = items.filter(
      item => !item.name.trim() || item.estimatedPrice <= 0 || item.quantity <= 0
    );

    if (invalidItems.length > 0) {
      Alert.alert(
        'Invalid Items',
        'Please ensure all items have a name, quantity, and estimated price.'
      );
      return false;
    }

    // Check if delivery address is complete
    if (!street.trim() || !city.trim() || !state.trim() || !zipCode.trim() || !country.trim()) {
      Alert.alert('Invalid Address', 'Please provide a complete delivery address.');
      return false;
    }

    // Check if delivery fee is valid
    if (isNaN(parseFloat(deliveryFee)) || parseFloat(deliveryFee) < 0) {
      Alert.alert('Invalid Delivery Fee', 'Please provide a valid delivery fee.');
      return false;
    }

    return true;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Delivery Request</Text>
      <Text style={styles.subtitle}>
        Trip to {trip.destination.name} on{' '}
        {new Date(trip.departureTime).toLocaleDateString()}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {items.map((item, index) => (
          <View key={item.id} style={styles.itemContainer}>
            <Text style={styles.itemHeader}>Item {index + 1}</Text>
            
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={item.name}
              onChangeText={(text) => updateItem(item.id, 'name', text)}
              placeholder="Item name"
            />
            
            <Text style={styles.label}>Description (optional)</Text>
            <TextInput
              style={styles.input}
              value={item.description}
              onChangeText={(text) => updateItem(item.id, 'description', text)}
              placeholder="Item description"
            />
            
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={item.quantity.toString()}
                  onChangeText={(text) => {
                    const quantity = parseInt(text) || 0;
                    updateItem(item.id, 'quantity', quantity);
                  }}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
              
              <View style={styles.halfColumn}>
                <Text style={styles.label}>Est. Price ($)</Text>
                <TextInput
                  style={styles.input}
                  value={item.estimatedPrice.toString()}
                  onChangeText={(text) => {
                    const price = parseFloat(text) || 0;
                    updateItem(item.id, 'estimatedPrice', price);
                  }}
                  keyboardType="numeric"
                  placeholder="0.00"
                />
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeItem(item.id)}
            >
              <Text style={styles.removeButtonText}>Remove Item</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>+ Add Another Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        
        <Text style={styles.label}>Street</Text>
        <TextInput
          style={styles.input}
          value={street}
          onChangeText={setStreet}
          placeholder="123 Main St"
        />
        
        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="City"
        />
        
        <View style={styles.row}>
          <View style={styles.halfColumn}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="State"
            />
          </View>
          
          <View style={styles.halfColumn}>
            <Text style={styles.label}>Zip Code</Text>
            <TextInput
              style={styles.input}
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="12345"
            />
          </View>
        </View>
        
        <Text style={styles.label}>Country</Text>
        <TextInput
          style={styles.input}
          value={country}
          onChangeText={setCountry}
          placeholder="Country"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Details</Text>
        
        <Text style={styles.label}>Delivery Fee ($)</Text>
        <TextInput
          style={styles.input}
          value={deliveryFee}
          onChangeText={setDeliveryFee}
          keyboardType="numeric"
          placeholder="5.00"
        />
        
        <Text style={styles.label}>Special Instructions (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={specialInstructions}
          onChangeText={setSpecialInstructions}
          placeholder="Any special instructions for the traveler"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        <View style={styles.summaryRow}>
          <Text>Items Total:</Text>
          <Text>${totalEstimatedCost.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text>Delivery Fee:</Text>
          <Text>${parseFloat(deliveryFee || '0').toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalText}>Total:</Text>
          <Text style={styles.totalText}>
            ${(totalEstimatedCost + parseFloat(deliveryFee || '0')).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: '#666'
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  itemContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  itemHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444'
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  halfColumn: {
    width: '48%'
  },
  removeButton: {
    backgroundColor: '#f8d7da',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center'
  },
  removeButtonText: {
    color: '#721c24'
  },
  addButton: {
    backgroundColor: '#e8f4f8',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8
  },
  addButtonText: {
    color: '#0066cc',
    fontWeight: '600'
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 16
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    flex: 1,
    marginRight: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600'
  },
  submitButton: {
    backgroundColor: '#0066cc',
    borderRadius: 4,
    padding: 12,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center'
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export default RequestCreationForm;