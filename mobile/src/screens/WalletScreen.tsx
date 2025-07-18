import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import WalletScreenComponent from '../components/payment/WalletScreen';

const WalletScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <WalletScreenComponent navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
});

export default WalletScreen;