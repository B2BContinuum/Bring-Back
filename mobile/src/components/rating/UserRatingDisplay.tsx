import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card, Avatar, Divider } from 'react-native-elements';
import RatingStars from './RatingStars';

interface Rating {
  id: string;
  rating: number;
  review?: string;
  created_at: string;
  rater_user: {
    id: string;
    name: string;
    profile_image?: string;
  };
}

interface UserRatingDisplayProps {
  userId: string;
  userName: string;
  averageRating: number;
  totalRatings: number;
  ratings: Rating[];
  loading?: boolean;
}

const UserRatingDisplay: React.FC<UserRatingDisplayProps> = ({
  userId,
  userName,
  averageRating,
  totalRatings,
  ratings,
  loading = false
}) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderRatingItem = ({ item }: { item: Rating }) => (
    <View style={styles.ratingItem}>
      <View style={styles.ratingHeader}>
        <Avatar
          rounded
          size="small"
          source={
            item.rater_user.profile_image
              ? { uri: item.rater_user.profile_image }
              : require('../../assets/default-avatar.png')
          }
          containerStyle={styles.avatar}
        />
        <View style={styles.ratingHeaderText}>
          <Text style={styles.raterName}>{item.rater_user.name}</Text>
          <Text style={styles.ratingDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
      
      <View style={styles.ratingStarsContainer}>
        <RatingStars rating={item.rating} size={16} disabled />
      </View>
      
      {item.review && (
        <Text style={styles.reviewText}>{item.review}</Text>
      )}
    </View>
  );

  return (
    <Card containerStyle={styles.card}>
      <View style={styles.summaryContainer}>
        <Text style={styles.userName}>{userName}'s Ratings</Text>
        <View style={styles.ratingOverview}>
          <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
          <RatingStars rating={averageRating} size={20} disabled />
          <Text style={styles.totalRatings}>({totalRatings} ratings)</Text>
        </View>
      </View>
      
      <Divider style={styles.divider} />
      
      <Text style={styles.sectionTitle}>Recent Reviews</Text>
      
      {ratings.length > 0 ? (
        <FlatList
          data={ratings}
          renderItem={renderRatingItem}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider style={styles.reviewDivider} />}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.noReviewsText}>No reviews yet</Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 15,
    margin: 10,
  },
  summaryContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  averageRating: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#0066cc',
  },
  totalRatings: {
    fontSize: 14,
    color: '#777',
    marginLeft: 10,
  },
  divider: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ratingItem: {
    marginBottom: 15,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    marginRight: 10,
  },
  ratingHeaderText: {
    flex: 1,
  },
  raterName: {
    fontSize: 16,
    fontWeight: '500',
  },
  ratingDate: {
    fontSize: 12,
    color: '#777',
  },
  ratingStarsContainer: {
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  reviewDivider: {
    marginVertical: 15,
  },
  noReviewsText: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

export default UserRatingDisplay;