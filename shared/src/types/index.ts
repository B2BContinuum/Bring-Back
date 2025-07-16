// Core data model interfaces for Bring-Back app

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  profileImage?: string;
  address: Address;
  rating: number;
  totalDeliveries: number;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  userId: string;
  destination: Location;
  departureTime: Date;
  estimatedReturnTime: Date;
  capacity: number;
  availableCapacity: number;
  status: TripStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryRequest {
  id: string;
  tripId: string;
  requesterId: string;
  items: RequestItem[];
  deliveryAddress: Address;
  maxItemBudget: number;
  deliveryFee: number;
  specialInstructions?: string;
  status: RequestStatus;
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

export interface Location {
  id: string;
  name: string;
  address: Address;
  coordinates: Coordinates;
  category: LocationCategory;
  verified: boolean;
  currentUserCount: number;
}

export interface LocationPresence {
  id: string;
  userId: string;
  locationId: string;
  checkedInAt: Date;
  checkedOutAt?: Date;
  isActive: boolean;
}

// Supporting interfaces
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RequestItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  estimatedPrice: number;
  actualPrice?: number;
  imageUrl?: string;
}

// Enums
export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  EMAIL_VERIFIED = 'email_verified',
  PHONE_VERIFIED = 'phone_verified',
  FULLY_VERIFIED = 'fully_verified'
}

export enum TripStatus {
  ANNOUNCED = 'announced',
  TRAVELING = 'traveling',
  AT_DESTINATION = 'at_destination',
  RETURNING = 'returning',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  PURCHASED = 'purchased',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum LocationCategory {
  GROCERY = 'grocery',
  PHARMACY = 'pharmacy',
  RETAIL = 'retail',
  RESTAURANT = 'restaurant',
  OTHER = 'other'
}