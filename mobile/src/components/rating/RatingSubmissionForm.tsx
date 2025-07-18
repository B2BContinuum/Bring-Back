import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { Button, Card } from 'react-native-elements';
import RatingStars from './RatingStars';
import { useRatings } from '../../hooks/useRatings';

interface RatingSubmissionFormProps {
  ratedUserId: string;
  ratedUserName: string;
  deliveryRequestId?: string;
  onSubmitSuccess: () => void;
  onCancel: () => void;
}

const RatingSubmissionForm: React.FC<RatingSubmissionFormProps> = ({
  ratedUserId,
  ratedUserName,
  deliveryRequestId,
  onSubmitSuccess,
  onCancel
}) => {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { submitRating } = useRatings();

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleReviewChange = (text: string) => {
    setReview(text);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitRating({
        ratedUserId,
        rating,
        review: review.trim() || undefined,
        deliveryRequestId
      });
      
      setIsSubmitting(false);
      Alert.alert(
        'Rating Submitted',
        'Thank you for your feedback!',
        [{ text: 'OK', onPress: onSubmitSuccess }]
      );
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert(
        'Submission Failed',
        `There was an error submitting your rating: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <Card containerStyle={styles.card}>
      <Card.Title>Rate Your Experience</Card.Title>
      
      <Text style={styles.subtitle}>
        How was your experience with {ratedUserName}?
      </Text>
      
      <View style={styles.ratingContainer}>
        <RatingStars
          rating={rating}
          onRatingChange={handleRatingChange}
          size={40}
        />
        <Text style={styles.ratingText}>
          {rating === 0 ? 'Tap to rate' :
           rating === 1 ? 'Poor' :
           rating === 2 ? 'Fair' :
           rating === 3 ? 'Good' :
           rating === 4 ? 'Very Good' : 'Excellent'}
        </Text>
      </View>
      
      <Text style={styles.reviewLabel}>Add a review (optional):</Text>
      <TextInput
        style={styles.reviewInput}
        value={review}
        onChangeText={handleReviewChange}
        placeholder="Share your experience..."
        multiline
        numberOfLines={4}
        maxLength={500}
      />
      <Text style={styles.charCount}>{review.length}/500</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Submit Rating"
          onPress={handleSubmit}
          disabled={isSubmitting || rating === 0}
          loading={isSubmitting}
          containerStyle={styles.submitButton}
        />
        <Button
          title="Cancel"
          type="outline"
          onPress={onCancel}
          disabled={isSubmitting}
          containerStyle={styles.cancelButton}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 15,
    margin: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    color: '#333',
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#777',
    marginTop: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  submitButton: {
    marginBottom: 10,
  },
  cancelButton: {
    marginBottom: 10,
  },
});

export default RatingSubmissionForm;