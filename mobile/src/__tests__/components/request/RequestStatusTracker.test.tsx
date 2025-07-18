import React from 'react';
import { render } from '@testing-library/react-native';
import RequestStatusTracker from '../../../components/request/RequestStatusTracker';
import { RequestStatus } from '../../../../../shared/src/types';

describe('RequestStatusTracker', () => {
  it('renders correctly with pending status', () => {
    const { getByText, getAllByText } = render(
      <RequestStatusTracker status={RequestStatus.PENDING} />
    );

    // Check if all status steps are displayed
    expect(getByText('Pending')).toBeTruthy();
    expect(getByText('Accepted')).toBeTruthy();
    expect(getByText('Purchased')).toBeTruthy();
    expect(getByText('Delivered')).toBeTruthy();
    
    // Check if status message is displayed
    expect(getByText('Your request is waiting for a traveler to accept it.')).toBeTruthy();
  });

  it('renders correctly with accepted status', () => {
    const acceptedDate = new Date();
    const { getByText } = render(
      <RequestStatusTracker 
        status={RequestStatus.ACCEPTED} 
        acceptedAt={acceptedDate}
      />
    );

    // Check if status message is displayed
    expect(getByText('A traveler has accepted your request and will purchase your items.')).toBeTruthy();
    
    // Check if timestamp is displayed (just check if time format exists, not exact time)
    const timeString = acceptedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    expect(getByText(timeString)).toBeTruthy();
  });

  it('renders correctly with purchased status', () => {
    const { getByText } = render(
      <RequestStatusTracker status={RequestStatus.PURCHASED} />
    );

    // Check if status message is displayed
    expect(getByText('Your items have been purchased and are on the way.')).toBeTruthy();
  });

  it('renders correctly with delivered status', () => {
    const completedDate = new Date();
    const { getByText } = render(
      <RequestStatusTracker 
        status={RequestStatus.DELIVERED} 
        completedAt={completedDate}
      />
    );

    // Check if status message is displayed
    expect(getByText('Your items have been delivered. Thank you for using our service!')).toBeTruthy();
    
    // Check if timestamp is displayed
    const timeString = completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    expect(getByText(timeString)).toBeTruthy();
  });

  it('renders correctly with cancelled status', () => {
    const { getByText, queryByText } = render(
      <RequestStatusTracker status={RequestStatus.CANCELLED} />
    );

    // Check if cancelled message is displayed
    expect(getByText('This request has been cancelled')).toBeTruthy();
    
    // Status steps should not be displayed
    expect(queryByText('Pending')).toBeNull();
  });
});