import { Trip } from '../Trip';
import { TripStatus, LocationCategory } from '../../../../shared/src/types';

describe('Trip Model', () => {
  const validTripData = {
    id: 'trip-123',
    userId: 'user-123',
    destination: {
      id: 'location-123',
      name: 'Test Store',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      },
      category: LocationCategory.GROCERY,
      verified: true,
      currentUserCount: 5
    },
    departureTime: new Date('2025-12-01T10:00:00Z'),
    estimatedReturnTime: new Date('2025-12-01T14:00:00Z'),
    capacity: 3,
    availableCapacity: 2,
    status: TripStatus.ANNOUNCED,
    description: 'Going to grocery store'
  };

  describe('Constructor', () => {
    it('should create a trip with valid data', () => {
      const trip = new Trip(validTripData);
      
      expect(trip.id).toBe(validTripData.id);
      expect(trip.userId).toBe(validTripData.userId);
      expect(trip.destination).toEqual(validTripData.destination);
      expect(trip.departureTime).toEqual(validTripData.departureTime);
      expect(trip.estimatedReturnTime).toEqual(validTripData.estimatedReturnTime);
      expect(trip.capacity).toBe(validTripData.capacity);
      expect(trip.availableCapacity).toBe(validTripData.availableCapacity);
      expect(trip.status).toBe(validTripData.status);
      expect(trip.description).toBe(validTripData.description);
    });

    it('should create a trip with default values for missing fields', () => {
      const trip = new Trip({ userId: 'user-123' });
      
      expect(trip.id).toBe('');
      expect(trip.userId).toBe('user-123');
      expect(trip.destination).toEqual({
        id: '',
        name: '',
        address: { street: '', city: '', state: '', zipCode: '', country: '' },
        coordinates: { latitude: 0, longitude: 0 },
        category: LocationCategory.OTHER,
        verified: false,
        currentUserCount: 0
      });
      expect(trip.capacity).toBe(1);
      expect(trip.availableCapacity).toBe(1);
      expect(trip.status).toBe(TripStatus.ANNOUNCED);
      expect(trip.description).toBeUndefined();
    });

    it('should set availableCapacity to capacity when not provided', () => {
      const { availableCapacity, ...tripDataWithoutCapacity } = validTripData;
      const trip = new Trip(tripDataWithoutCapacity);
      
      expect(trip.availableCapacity).toBe(trip.capacity);
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const beforeCreate = new Date();
      const trip = new Trip(validTripData);
      const afterCreate = new Date();
      
      expect(trip.createdAt).toBeInstanceOf(Date);
      expect(trip.updatedAt).toBeInstanceOf(Date);
      expect(trip.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(trip.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Static Validation Methods', () => {
    describe('validateForCreation', () => {
      it('should validate complete trip data successfully', () => {
        const result = Trip.validateForCreation(validTripData);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for missing required fields', () => {
        const incompleteData = { userId: 'user-123' };
        const result = Trip.validateForCreation(incompleteData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(error => error.includes('destination'))).toBe(true);
        expect(result.errors.some(error => error.includes('departureTime'))).toBe(true);
        expect(result.errors.some(error => error.includes('estimatedReturnTime'))).toBe(true);
      });

      it('should return errors for invalid capacity', () => {
        const invalidData = {
          ...validTripData,
          capacity: 0
        };
        const result = Trip.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('Capacity must be at least 1'))).toBe(true);
      });

      it('should return errors for capacity exceeding maximum', () => {
        const invalidData = {
          ...validTripData,
          capacity: 15
        };
        const result = Trip.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('Capacity cannot exceed 10'))).toBe(true);
      });

      it('should return errors for invalid time sequence', () => {
        const invalidData = {
          ...validTripData,
          departureTime: new Date('2025-12-01T14:00:00Z'),
          estimatedReturnTime: new Date('2025-12-01T10:00:00Z') // Before departure
        };
        const result = Trip.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('Estimated return time must be after departure time'))).toBe(true);
      });

      it('should return errors for past departure time', () => {
        const invalidData = {
          ...validTripData,
          departureTime: new Date('2020-01-01T10:00:00Z'), // Past date
          estimatedReturnTime: new Date('2020-01-01T14:00:00Z')
        };
        const result = Trip.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('Departure time must be in the future'))).toBe(true);
      });
    });

    describe('validateCapacity', () => {
      it('should validate correct capacity values', () => {
        const result = Trip.validateCapacity(5, 3);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject capacity below minimum', () => {
        const result = Trip.validateCapacity(0);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Capacity must be at least 1');
      });

      it('should reject capacity above maximum', () => {
        const result = Trip.validateCapacity(15);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Capacity cannot exceed 10');
      });

      it('should reject negative available capacity', () => {
        const result = Trip.validateCapacity(5, -1);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Available capacity cannot be negative');
      });

      it('should reject available capacity exceeding total capacity', () => {
        const result = Trip.validateCapacity(5, 7);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Available capacity cannot exceed total capacity');
      });
    });

    describe('validateTiming', () => {
      it('should validate correct timing', () => {
        const departureTime = new Date('2025-12-01T10:00:00Z');
        const returnTime = new Date('2025-12-01T14:00:00Z');
        const result = Trip.validateTiming(departureTime, returnTime);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject past departure time', () => {
        const departureTime = new Date('2020-01-01T10:00:00Z');
        const returnTime = new Date('2020-01-01T14:00:00Z');
        const result = Trip.validateTiming(departureTime, returnTime);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Departure time must be in the future');
      });

      it('should reject return time before departure time', () => {
        const departureTime = new Date('2025-12-01T14:00:00Z');
        const returnTime = new Date('2025-12-01T10:00:00Z');
        const result = Trip.validateTiming(departureTime, returnTime);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Estimated return time must be after departure time');
      });
    });
  });

  describe('Instance Validation Methods', () => {
    let trip: Trip;

    beforeEach(() => {
      trip = new Trip(validTripData);
    });

    describe('validate', () => {
      it('should validate a valid trip instance', () => {
        const result = trip.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid trip instance', () => {
        trip.capacity = 0;
        trip.departureTime = new Date('2020-01-01T10:00:00Z');
        
        const result = trip.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateCapacity', () => {
      it('should validate trip capacity', () => {
        const result = trip.validateCapacity();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid capacity', () => {
        trip.capacity = 0;
        trip.availableCapacity = -1;
        const result = trip.validateCapacity();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateTiming', () => {
      it('should validate trip timing', () => {
        const result = trip.validateTiming();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid timing', () => {
        trip.departureTime = new Date('2020-01-01T10:00:00Z');
        const result = trip.validateTiming();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Capacity Management Methods', () => {
    let trip: Trip;

    beforeEach(() => {
      trip = new Trip(validTripData);
    });

    describe('hasAvailableCapacity', () => {
      it('should return true when there is available capacity', () => {
        trip.availableCapacity = 2;
        
        expect(trip.hasAvailableCapacity()).toBe(true);
      });

      it('should return false when there is no available capacity', () => {
        trip.availableCapacity = 0;
        
        expect(trip.hasAvailableCapacity()).toBe(false);
      });
    });

    describe('canAcceptRequests', () => {
      it('should return true for announced trip with available capacity', () => {
        trip.status = TripStatus.ANNOUNCED;
        trip.availableCapacity = 2;
        
        expect(trip.canAcceptRequests()).toBe(true);
      });

      it('should return false for non-announced trip', () => {
        trip.status = TripStatus.TRAVELING;
        trip.availableCapacity = 2;
        
        expect(trip.canAcceptRequests()).toBe(false);
      });

      it('should return false for announced trip without available capacity', () => {
        trip.status = TripStatus.ANNOUNCED;
        trip.availableCapacity = 0;
        
        expect(trip.canAcceptRequests()).toBe(false);
      });
    });

    describe('reserveCapacity', () => {
      it('should reserve capacity when available', () => {
        trip.availableCapacity = 3;
        const originalUpdatedAt = trip.updatedAt;
        
        const result = trip.reserveCapacity(2);
        
        expect(result).toBe(true);
        expect(trip.availableCapacity).toBe(1);
        expect(trip.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      });

      it('should not reserve capacity when insufficient', () => {
        trip.availableCapacity = 1;
        const originalCapacity = trip.availableCapacity;
        
        const result = trip.reserveCapacity(2);
        
        expect(result).toBe(false);
        expect(trip.availableCapacity).toBe(originalCapacity);
      });

      it('should reserve 1 capacity by default', () => {
        trip.availableCapacity = 3;
        
        const result = trip.reserveCapacity();
        
        expect(result).toBe(true);
        expect(trip.availableCapacity).toBe(2);
      });
    });

    describe('releaseCapacity', () => {
      it('should release capacity up to total capacity', () => {
        trip.capacity = 5;
        trip.availableCapacity = 2;
        const originalUpdatedAt = trip.updatedAt;
        
        trip.releaseCapacity(2);
        
        expect(trip.availableCapacity).toBe(4);
        expect(trip.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      });

      it('should not exceed total capacity when releasing', () => {
        trip.capacity = 5;
        trip.availableCapacity = 4;
        
        trip.releaseCapacity(3);
        
        expect(trip.availableCapacity).toBe(5); // Should not exceed capacity
      });

      it('should release 1 capacity by default', () => {
        trip.availableCapacity = 2;
        
        trip.releaseCapacity();
        
        expect(trip.availableCapacity).toBe(3);
      });
    });
  });

  describe('Status Management Methods', () => {
    let trip: Trip;

    beforeEach(() => {
      trip = new Trip(validTripData);
    });

    describe('updateStatus', () => {
      it('should update trip status and timestamp', () => {
        const originalUpdatedAt = trip.updatedAt;
        
        trip.updateStatus(TripStatus.TRAVELING);
        
        expect(trip.status).toBe(TripStatus.TRAVELING);
        expect(trip.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
      });
    });

    describe('isActive', () => {
      it('should return true for active statuses', () => {
        const activeStatuses = [TripStatus.ANNOUNCED, TripStatus.TRAVELING, TripStatus.AT_DESTINATION, TripStatus.RETURNING];
        
        activeStatuses.forEach(status => {
          trip.status = status;
          expect(trip.isActive()).toBe(true);
        });
      });

      it('should return false for inactive statuses', () => {
        const inactiveStatuses = [TripStatus.COMPLETED, TripStatus.CANCELLED];
        
        inactiveStatuses.forEach(status => {
          trip.status = status;
          expect(trip.isActive()).toBe(false);
        });
      });
    });

    describe('isInProgress', () => {
      it('should return true for in-progress statuses', () => {
        const inProgressStatuses = [TripStatus.TRAVELING, TripStatus.AT_DESTINATION, TripStatus.RETURNING];
        
        inProgressStatuses.forEach(status => {
          trip.status = status;
          expect(trip.isInProgress()).toBe(true);
        });
      });

      it('should return false for non-in-progress statuses', () => {
        const notInProgressStatuses = [TripStatus.ANNOUNCED, TripStatus.COMPLETED, TripStatus.CANCELLED];
        
        notInProgressStatuses.forEach(status => {
          trip.status = status;
          expect(trip.isInProgress()).toBe(false);
        });
      });
    });
  });

  describe('Utility Methods', () => {
    let trip: Trip;

    beforeEach(() => {
      trip = new Trip({
        ...validTripData,
        departureTime: new Date('2025-12-01T10:00:00Z'),
        estimatedReturnTime: new Date('2025-12-01T14:00:00Z')
      });
    });

    describe('getDurationHours', () => {
      it('should calculate trip duration in hours', () => {
        const duration = trip.getDurationHours();
        
        expect(duration).toBe(4); // 4 hours between 10:00 and 14:00
      });

      it('should round up partial hours', () => {
        trip.estimatedReturnTime = new Date('2025-12-01T13:30:00Z'); // 3.5 hours
        const duration = trip.getDurationHours();
        
        expect(duration).toBe(4); // Should round up to 4
      });
    });

    describe('getTimeUntilDepartureMinutes', () => {
      it('should calculate time until departure', () => {
        // Mock current time to be 1 hour before departure
        const mockDate = new Date('2025-12-01T09:00:00Z');
        const originalDate = global.Date;
        global.Date = jest.fn(() => mockDate) as any;
        global.Date.now = jest.fn(() => mockDate.getTime());
        
        const timeUntil = trip.getTimeUntilDepartureMinutes();
        
        expect(timeUntil).toBe(60); // 1 hour = 60 minutes
        
        global.Date = originalDate;
      });

      it('should return 0 for past departure time', () => {
        // Mock current time to be after departure
        const mockDate = new Date('2025-12-01T11:00:00Z');
        const originalDate = global.Date;
        global.Date = jest.fn(() => mockDate) as any;
        global.Date.now = jest.fn(() => mockDate.getTime());
        
        const timeUntil = trip.getTimeUntilDepartureMinutes();
        
        expect(timeUntil).toBe(0);
        
        global.Date = originalDate;
      });
    });

    describe('isDepartingSoon', () => {
      it('should return true when departing within specified minutes', () => {
        // Mock current time to be 20 minutes before departure
        const mockDate = new Date('2025-12-01T09:40:00Z');
        const originalDate = global.Date;
        global.Date = jest.fn(() => mockDate) as any;
        global.Date.now = jest.fn(() => mockDate.getTime());
        
        const isDepartingSoon = trip.isDepartingSoon(30);
        
        expect(isDepartingSoon).toBe(true);
        
        global.Date = originalDate;
      });

      it('should return false when departing beyond specified minutes', () => {
        // Mock current time to be 45 minutes before departure
        const mockDate = new Date('2025-12-01T09:15:00Z');
        const originalDate = global.Date;
        global.Date = jest.fn(() => mockDate) as any;
        global.Date.now = jest.fn(() => mockDate.getTime());
        
        const isDepartingSoon = trip.isDepartingSoon(30);
        
        expect(isDepartingSoon).toBe(false);
        
        global.Date = originalDate;
      });

      it('should return false for past departure time', () => {
        // Mock current time to be after departure
        const mockDate = new Date('2025-12-01T11:00:00Z');
        const originalDate = global.Date;
        global.Date = jest.fn(() => mockDate) as any;
        global.Date.now = jest.fn(() => mockDate.getTime());
        
        const isDepartingSoon = trip.isDepartingSoon(30);
        
        expect(isDepartingSoon).toBe(false);
        
        global.Date = originalDate;
      });

      it('should use default 30 minutes when not specified', () => {
        // Mock current time to be 25 minutes before departure
        const mockDate = new Date('2025-12-01T09:35:00Z');
        const originalDate = global.Date;
        global.Date = jest.fn(() => mockDate) as any;
        global.Date.now = jest.fn(() => mockDate.getTime());
        
        const isDepartingSoon = trip.isDepartingSoon();
        
        expect(isDepartingSoon).toBe(true);
        
        global.Date = originalDate;
      });
    });

    describe('touch', () => {
      it('should update the updatedAt timestamp', () => {
        const originalUpdatedAt = trip.updatedAt;
        
        // Wait a small amount to ensure timestamp difference
        setTimeout(() => {
          trip.touch();
          expect(trip.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        }, 1);
      });
    });
  });
});