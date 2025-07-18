import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Card } from 'react-native-elements';

interface TipSelectorProps {
  deliveryFee: number;
  onTipChange: (tipAmount: number) => void;
  currency?: string;
}

const TipSelector: React.FC<TipSelectorProps> = ({
  deliveryFee,
  onTipChange,
  currency = 'USD'
}) => {
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(15);
  const [customTip, setCustomTip] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  const tipPercentages = [0, 10, 15, 20, 25];

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const calculateTipAmount = (percentage: number): number => {
    return (deliveryFee * percentage) / 100;
  };

  const handlePercentageSelect = (percentage: number) => {
    setSelectedPercentage(percentage);
    setIsCustom(false);
    onTipChange(calculateTipAmount(percentage));
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setIsCustom(true);
    setSelectedPercentage(null);
    
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      onTipChange(numericValue);
    } else {
      onTipChange(0);
    }
  };

  return (
    <Card containerStyle={styles.card}>
      <Card.Title>Add a Tip</Card.Title>
      <Text style={styles.subtitle}>
        100% of your tip goes to the traveler
      </Text>
      
      <View style={styles.percentageContainer}>
        {tipPercentages.map((percentage) => (
          <TouchableOpacity
            key={percentage}
            style={[
              styles.percentageButton,
              selectedPercentage === percentage && !isCustom && styles.selectedPercentage
            ]}
            onPress={() => handlePercentageSelect(percentage)}
          >
            <Text
              style={[
                styles.percentageText,
                selectedPercentage === percentage && !isCustom && styles.selectedPercentageText
              ]}
            >
              {percentage}%
            </Text>
            <Text
              style={[
                styles.amountText,
                selectedPercentage === percentage && !isCustom && styles.selectedAmountText
              ]}
            >
              {formatCurrency(calculateTipAmount(percentage))}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.customTipContainer}>
        <Text style={styles.customTipLabel}>Custom Tip:</Text>
        <TextInput
          style={[
            styles.customTipInput,
            isCustom && styles.selectedCustomTip
          ]}
          value={customTip}
          onChangeText={handleCustomTipChange}
          placeholder="0.00"
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
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
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  percentageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  percentageButton: {
    width: '18%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedPercentage: {
    borderColor: '#0066cc',
    backgroundColor: 'rgba(0, 102, 204, 0.05)',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedPercentageText: {
    color: '#0066cc',
  },
  amountText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedAmountText: {
    color: '#0066cc',
  },
  customTipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  customTipLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 10,
  },
  customTipInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  selectedCustomTip: {
    borderColor: '#0066cc',
  },
});

export default TipSelector;