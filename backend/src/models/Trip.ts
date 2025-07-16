import { Trip as ITrip, TripStatus, Location } from 'bring-back-shared';

export class Trip implements ITrip {
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

  constructor(data: Partial<ITrip>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.destination = data.destination || {
      id: '',
      name: '',
      address: { street: '', city: '', state: '', zipCode: '', country: '' },
      coordinates: { latitude: 0, longitude: 0 },
      category: 'other' as any,
      verified: false,
      currentUserCount: 0
    };
    this.departureTime = data.departureTime || new Date();
    this.estimatedReturnTime = data.estimatedReturnTime || new Date();
    this.capacity = data.capacity || 1;
    this.availableCapacity = data.availableCapacity || this.capacity;
    this.status = data.status || TripStatus.ANNOUNCED;
    this.description = data.description;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}