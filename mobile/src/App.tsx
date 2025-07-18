import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, LogBox } from 'react-native';
import 'react-native-url-polyfill/auto';
import AppNavigator from './navigation/AppNavigator';

// Ignore specific warnings that might come from dependencies
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default App;