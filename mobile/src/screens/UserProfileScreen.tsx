import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Avatar, Button, Card } from 'react-native-elements';
import UserRatingDisplay from '../components/rating/UserRatingDisplay';
import { useRatings } from '../hooks/useRatings';
import { userService } from '../services/userService';

const UserProfileScreen = ({ navigation }) => {
  const route = useRoute();
  const { userId } = route.params as { userId: string };
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { getUserRatings, userRatings } = useRatings();
  
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Fetch user profile
        const userData = await userService.getUserById(userId);
        setUser(userData);
        
        // Fetch user ratings
        await getUserRatings(userId);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  const handleRateUser = () => {
    navigation.navigate('Rating', {
      ratedUserId: userId,
      ratedUserName: user?.name || 'User'
    });
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading user profile...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          containerStyle={styles.errorButton}
        />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Card containerStyle={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar
              rounded
              size="large"
              source={
                user?.profileImage
                  ? { uri: user.profileImage }
                  : require('../assets/default-avatar.png')
              }
              containerStyle={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userInfo}>Member since {new Date(user?.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.userInfo}>{user?.totalDeliveries || 0} deliveries completed</Text>
            </View>
          </View>
          
          <Button
            title="Rate This User"
            type="outline"
            onPress={handleRateUser}
            containerStyle={styles.rateButton}
          />
        </Card>
        
        {userRatings && (
          <UserRatingDisplay
            userId={userRatings.userId}
            userName={userRatings.userName}
            averageRating={userRatings.averageRating}
            totalRatings={userRatings.totalRatings}
            ratings={userRatings.ratings}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
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
    color: '#ff3b30',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    width: '50%',
  },
  profileCard: {
    borderRadius: 10,
    padding: 15,
    margin: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  rateButton: {
    marginTop: 10,
  },
});

export default UserProfileScreen;