import { Location, Coordinates, LocationPresence } from '../types/location.types';

const API_URL = 'http://localhost:3000/api'; // Replace with your actual API URL

export const searchLocations = async (query: string): Promise<Location[]> => {
  try {
    const response = await fetch(`${API_URL}/locations/search?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Error searching locations: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to search locations:', error);
    throw error;
  }
};

export const getNearbyLocations = async (coordinates: Coordinates, radius: number = 5): Promise<Location[]> => {
  try {
    const { latitude, longitude } = coordinates;
    const response = await fetch(
      `${API_URL}/locations/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
    );
    
    if (!response.ok) {
      throw new Error(`Error fetching nearby locations: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch nearby locations:', error);
    throw error;
  }
};

export const getLocationPresence = async (locationId: string): Promise<number> => {
  try {
    const response = await fetch(`${API_URL}/locations/${locationId}/presence`);
    
    if (!response.ok) {
      throw new Error(`Error fetching location presence: ${response.status}`);
    }
    
    const data = await response.json();
    return data.currentUserCount;
  } catch (error) {
    console.error('Failed to fetch location presence:', error);
    throw error;
  }
};

export const checkInToLocation = async (locationId: string): Promise<LocationPresence> => {
  try {
    const response = await fetch(`${API_URL}/locations/${locationId}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error checking in to location: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to check in to location:', error);
    throw error;
  }
};

export const checkOutFromLocation = async (locationId: string): Promise<LocationPresence> => {
  try {
    const response = await fetch(`${API_URL}/locations/${locationId}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error checking out from location: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to check out from location:', error);
    throw error;
  }
};

export const verifyUserLocation = async (
  locationId: string, 
  userCoordinates: Coordinates
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/locations/${locationId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordinates: userCoordinates }),
    });
    
    if (!response.ok) {
      throw new Error(`Error verifying location: ${response.status}`);
    }
    
    const data = await response.json();
    return data.verified;
  } catch (error) {
    console.error('Failed to verify location:', error);
    throw error;
  }
};