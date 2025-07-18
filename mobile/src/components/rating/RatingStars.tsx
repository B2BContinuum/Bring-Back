import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  disabled?: boolean;
  onRatingChange?: (rating: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 30,
  color = '#FFD700',
  disabled = false,
  onRatingChange
}) => {
  const handlePress = (selectedRating: number) => {
    if (!disabled && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(maxRating)].map((_, index) => {
        const starIndex = index + 1;
        const isFilled = starIndex <= rating;
        const isHalfFilled = !isFilled && starIndex - 0.5 <= rating;
        
        return (
          <TouchableOpacity
            key={index}
            style={styles.starContainer}
            onPress={() => handlePress(starIndex)}
            disabled={disabled}
          >
            <Icon
              name={isFilled ? 'star' : isHalfFilled ? 'star-half' : 'star-outline'}
              type="material-community"
              size={size}
              color={isFilled || isHalfFilled ? color : '#CCCCCC'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    padding: 2,
  },
});

export default RatingStars;