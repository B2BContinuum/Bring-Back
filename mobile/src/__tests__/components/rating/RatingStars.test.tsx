import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import RatingStars from '../../../components/rating/RatingStars';

describe('RatingStars', () => {
  const mockOnRatingChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<RatingStars rating={3} />);
    
    // With default maxRating of 5, we should have 5 stars
    const stars = screen.getAllByType('Icon');
    expect(stars.length).toBe(5);
    
    // First 3 stars should be filled, last 2 should be outline
    expect(stars[0].props.name).toBe('star');
    expect(stars[1].props.name).toBe('star');
    expect(stars[2].props.name).toBe('star');
    expect(stars[3].props.name).toBe('star-outline');
    expect(stars[4].props.name).toBe('star-outline');
  });

  it('renders correctly with custom maxRating', () => {
    render(<RatingStars rating={2} maxRating={3} />);
    
    const stars = screen.getAllByType('Icon');
    expect(stars.length).toBe(3);
    
    // First 2 stars should be filled, last 1 should be outline
    expect(stars[0].props.name).toBe('star');
    expect(stars[1].props.name).toBe('star');
    expect(stars[2].props.name).toBe('star-outline');
  });

  it('renders correctly with custom size and color', () => {
    render(<RatingStars rating={4} size={40} color="#FF0000" />);
    
    const stars = screen.getAllByType('Icon');
    
    // Check size and color of filled stars
    expect(stars[0].props.size).toBe(40);
    expect(stars[0].props.color).toBe('#FF0000');
    
    // Check color of unfilled stars
    expect(stars[4].props.color).toBe('#CCCCCC');
  });

  it('handles star press when not disabled', () => {
    render(<RatingStars rating={3} onRatingChange={mockOnRatingChange} />);
    
    const stars = screen.getAllByType('Icon');
    
    // Press the 5th star
    fireEvent.press(stars[4].parent);
    
    expect(mockOnRatingChange).toHaveBeenCalledWith(5);
    
    // Press the 2nd star
    fireEvent.press(stars[1].parent);
    
    expect(mockOnRatingChange).toHaveBeenCalledWith(2);
  });

  it('does not handle star press when disabled', () => {
    render(<RatingStars rating={3} onRatingChange={mockOnRatingChange} disabled />);
    
    const stars = screen.getAllByType('Icon');
    
    // Press the 5th star
    fireEvent.press(stars[4].parent);
    
    expect(mockOnRatingChange).not.toHaveBeenCalled();
  });

  it('renders half-filled stars correctly', () => {
    render(<RatingStars rating={3.5} />);
    
    const stars = screen.getAllByType('Icon');
    
    // First 3 stars should be filled, 4th should be half-filled, 5th should be outline
    expect(stars[0].props.name).toBe('star');
    expect(stars[1].props.name).toBe('star');
    expect(stars[2].props.name).toBe('star');
    expect(stars[3].props.name).toBe('star-half');
    expect(stars[4].props.name).toBe('star-outline');
  });
});