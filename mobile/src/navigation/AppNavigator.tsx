import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LocationScreen from '../screens/LocationScreen';
import TripScreen from '../screens/TripScreen';

// Placeholder screens for other tabs
const PlaceholderScreen = ({ route }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24 }}>{route.name} Screen</Text>
    <Text>Coming soon!</Text>
  </View>
);

// Create stack navigators for each tab
const LocationStack = createStackNavigator();
const LocationStackScreen = () => (
  <LocationStack.Navigator>
    <LocationStack.Screen 
      name="Locations" 
      component={LocationScreen}
      options={{ headerShown: false }}
    />
  </LocationStack.Navigator>
);

const TripsStack = createStackNavigator();
const TripsStackScreen = () => (
  <TripsStack.Navigator>
    <TripsStack.Screen 
      name="Trips" 
      component={TripScreen}
      options={{ headerShown: false }}
    />
  </TripsStack.Navigator>
);

const RequestsStack = createStackNavigator();
const RequestsStackScreen = () => (
  <RequestsStack.Navigator>
    <RequestsStack.Screen 
      name="Requests" 
      component={PlaceholderScreen}
      options={{ headerShown: false }}
    />
  </RequestsStack.Navigator>
);

const ProfileStack = createStackNavigator();
const ProfileStackScreen = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen 
      name="Profile" 
      component={PlaceholderScreen}
      options={{ headerShown: false }}
    />
  </ProfileStack.Navigator>
);

// Create bottom tab navigator
const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'LocationTab') {
              iconName = 'place';
            } else if (route.name === 'TripsTab') {
              iconName = 'directions-car';
            } else if (route.name === 'RequestsTab') {
              iconName = 'shopping-bag';
            } else if (route.name === 'ProfileTab') {
              iconName = 'person';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: '#0066cc',
          inactiveTintColor: 'gray',
        }}
      >
        <Tab.Screen 
          name="LocationTab" 
          component={LocationStackScreen} 
          options={{ title: 'Locations' }}
        />
        <Tab.Screen 
          name="TripsTab" 
          component={TripsStackScreen} 
          options={{ title: 'Trips' }}
        />
        <Tab.Screen 
          name="RequestsTab" 
          component={RequestsStackScreen} 
          options={{ title: 'Requests' }}
        />
        <Tab.Screen 
          name="ProfileTab" 
          component={ProfileStackScreen} 
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;