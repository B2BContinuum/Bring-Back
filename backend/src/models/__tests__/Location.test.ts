import { Location } from '../Location';
import { LocationCategory } from '../../../../shared/src/types';

describe('Location Model', () => {
  const validLocationData = {
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
  };

  describe('Constructor', () => {
    it('should create a location with valid data', () => {
      const location = new Location(validLocationData);
      
      expect(location.id).toBe(validLocationData.id);
      expect(location.name).toBe(validLocationData.name);
      expect(location.address).toEqual(validLocationData.address);
      expect(location.coordinates).toEqual(validLocationData.coordinates);
      expect(location.category).toBe(validLocationData.category);
      expect(location.verified).toBe(validLocationData.verified);
      expect(location.currentUserCount).toBe(validLocationData.currentUserCount);
    });

    it('should create a location with default values for missing fields', () => {
      const location = new Location({ name: 'Test Store' });
      
      expect(location.id).toBe('');
      expect(location.name).toBe('Test Store');
      expect(location.address).toEqual({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      });
      expect(location.coordinates).toEqual({
        latitude: 0,
        longitude: 0
      });
      expect(location.category).toBe(LocationCategory.OTHER);
      expect(location.verified).toBe(false);
      expect(location.currentUserCount).toBe(0);
    });
  });

  describe('Static Validation Methods', () => {
    describe('validateForCreation', () => {
      it('should validate complete location data successfully', () => {
        const result = Location.validateForCreation(validLocationData);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for missing required fields', () => {
        const incompleteData = { name: 'Test Store' };
        const result = Location.validateForCreation(incompleteData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(error => error.includes('address'))).toBe(true);
        expect(result.errors.some(error => error.includes('coordinates'))).toBe(true);
      });

      it('should return errors for invalid coordinates', () => {
        const invalidData = {
          ...validLocationData,
          coordinates: { latitude: 91, longitude: -181 }
        };
        const result = Location.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('latitude'))).toBe(true);
        expect(result.errors.some(error => error.includes('longitude'))).toBe(true);
      });
    });

    describe('validateCoordinates', () => {
      it('should validate correct coordinates', () => {
        const result = Location.validateCoordinates({ latitude: 37.7749, longitude: -122.4194 });
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid coordinates', () => {
        const result = Location.validateCoordinates({ latitude: 91, longitude: -181 });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateAddress', () => {
      it('should validate complete address', () => {
        const result = Location.validateAddress(validLocationData.address);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject incomplete address', () => {
        const incompleteAddress = {
          street: '123 Main St',
          city: '',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        };
        const result = Location.validateAddress(incompleteAddress);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('city'))).toBe(true);
      });
    });
  });

  describe('Instance Validation Methods', () => {
    let location: Location;

    beforeEach(() => {
      location = new Location(validLocationData);
    });

    describe('validate', () => {
      it('should validate a valid location instance', () => {
        const result = location.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid location instance', () => {
        location.name = '';
        location.coordinates = { latitude: 91, longitude: -181 };
        
        const result = location.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateCoordinates', () => {
      it('should validate location coordinates', () => {
        const result = location.validateCoordinates();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid coordinates', () => {
        location.coordinates = { latitude: 91, longitude: -181 };
        const result = location.validateCoordinates();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateAddress', () => {
      it('should validate location address', () => {
        const result = location.validateAddress();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid address', () => {
        const testLocation = new Location({
          ...validLocationData,
          address: {
            ...validLocationData.address,
            city: '',
            street: ''
          }
        });
        
        const result = testLocation.validateAddress();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Utility Methods', () => {
    let location1: Location;
    let location2: Location;

    beforeEach(() => {
      location1 = new Location(validLocationData);
      location2 = new Location({
        ...validLocationData,
        id: 'location-456',
        coordinates: { latitude: 37.7849, longitude: -122.4094 } // ~1.5km away
      });
    });

    describe('distanceTo', () => {
      it('should calculate distance between two locations', () => {
        const distance = location1.distanceTo(location2);
        
        expect(distance).toBeGreaterThan(0);
        expect(distance).toBeLessThan(2); // Should be less than 2km
      });

      it('should return 0 for same location', () => {
        const distance = location1.distanceTo(location1);
        
        expect(distance).toBe(0);
      });
    });

    describe('isWithinRadius', () => {
      it('should return true for locations within radius', () => {
        const isWithin = location1.isWithinRadius(location2, 5);
        
        expect(isWithin).toBe(true);
      });

      it('should return false for locations outside radius', () => {
        const isWithin = location1.isWithinRadius(location2, 0.5);
        
        expect(isWithin).toBe(false);
      });
    });

    describe('getFormattedAddress', () => {
      it('should return formatted address string', () => {
        const formatted = location1.getFormattedAddress();
        
        expect(formatted).toBe('123 Main St, Anytown, CA 12345');
      });
    });

    describe('hasActiveUsers', () => {
      it('should return true when there are active users', () => {
        location1.currentUserCount = 3;
        
        expect(location1.hasActiveUsers()).toBe(true);
      });

      it('should return false when there are no active users', () => {
        location1.currentUserCount = 0;
        
        expect(location1.hasActiveUsers()).toBe(false);
      });
    });
  });
});