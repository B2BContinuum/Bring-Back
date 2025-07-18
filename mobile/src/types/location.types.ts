export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export enum LocationCategory {
  GROCERY = 'GROCERY',
  PHARMACY = 'PHARMACY',
  RETAIL = 'RETAIL',
  RESTAURANT = 'RESTAURANT',
  OTHER = 'OTHER'
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

export interface LocationSearchResult {
  locations: Location[];
  loading: boolean;
  error: string | null;
}