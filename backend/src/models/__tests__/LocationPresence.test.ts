import { LocationPresence } from '../LocationPresence';

describe('LocationPresence Model', () => {
  const validPresenceData = {
    id: 'presence-123',
    userId: 'user-123',
    locationId: 'location-123',
    checkedInAt: new Date('2023-01-01T10:00:00Z'),
    isActive: true
  };

  describe('Constructor', () => {
    it('should create a location presence with valid data', () => {
      const presence = new LocationPresence(validPresenceData);
      
      expect(presence.id).toBe(validPresenceData.id);
      expect(presence.userId).toBe(validPresenceData.userId);
      expect(presence.locationId).toBe(validPresenceData.locationId);
      expect(presence.checkedInAt).toEqual(validPresenceData.checkedInAt);
      expect(presence.checkedOutAt).toBeUndefined();
      expect(presence.isActive).toBe(validPresenceData.isActive);
    });

    it('should create a location presence with default values for missing fields', () => {
      const presence = new LocationPresence({ userId: 'user-123', locationId: 'location-123' });
      
      expect(presence.id).toBe('');
      expect(presence.userId).toBe('user-123');
      expect(presence.locationId).toBe('location-123');
      expect(presence.checkedInAt).toBeInstanceOf(Date);
      expect(presence.checkedOutAt).toBeUndefined();
      expect(presence.isActive).toBe(true);
    });

    it('should handle checked out presence', () => {
      const checkedOutData = {
        ...validPresenceData,
        checkedOutAt: new Date('2023-01-01T12:00:00Z'),
        isActive: false
      };
      const presence = new LocationPresence(checkedOutData);
      
      expect(presence.checkedOutAt).toEqual(checkedOutData.checkedOutAt);
      expect(presence.isActive).toBe(false);
    });
  });

  describe('Static Validation Methods', () => {
    describe('validateForCreation', () => {
      it('should validate complete presence data successfully', () => {
        const result = LocationPresence.validateForCreation(validPresenceData);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for missing required fields', () => {
        const incompleteData = { userId: 'user-123' };
        const result = LocationPresence.validateForCreation(incompleteData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(error => error.includes('locationId'))).toBe(true);
      });

      it('should return errors for invalid time sequence', () => {
        const invalidData = {
          ...validPresenceData,
          checkedInAt: new Date('2023-01-01T12:00:00Z'),
          checkedOutAt: new Date('2023-01-01T10:00:00Z') // Before check-in
        };
        const result = LocationPresence.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('Check-out time must be after check-in time'))).toBe(true);
      });
    });
  });

  describe('Instance Validation Methods', () => {
    let presence: LocationPresence;

    beforeEach(() => {
      presence = new LocationPresence(validPresenceData);
    });

    describe('validate', () => {
      it('should validate a valid presence instance', () => {
        const result = presence.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid presence instance', () => {
        presence.userId = '';
        presence.locationId = '';
        
        const result = presence.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateTimeSequence', () => {
      it('should validate correct time sequence', () => {
        presence.checkedOutAt = new Date('2023-01-01T12:00:00Z');
        const result = presence.validateTimeSequence();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid time sequence', () => {
        presence.checkedOutAt = new Date('2023-01-01T09:00:00Z'); // Before check-in
        const result = presence.validateTimeSequence();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Check-out time must be after check-in time');
      });

      it('should be valid when no check-out time is set', () => {
        const result = presence.validateTimeSequence();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('validateIds', () => {
      it('should validate when both IDs are present', () => {
        const result = presence.validateIds();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for missing user ID', () => {
        presence.userId = '';
        const result = presence.validateIds();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('User ID is required');
      });

      it('should return errors for missing location ID', () => {
        presence.locationId = '';
        const result = presence.validateIds();
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Location ID is required');
      });
    });
  });

  describe('Utility Methods', () => {
    let presence: LocationPresence;

    beforeEach(() => {
      presence = new LocationPresence({
        ...validPresenceData,
        checkedInAt: new Date('2023-01-01T10:00:00Z')
      });
    });

    describe('checkOut', () => {
      it('should set check-out time and mark as inactive', () => {
        const beforeCheckOut = new Date();
        presence.checkOut();
        const afterCheckOut = new Date();
        
        expect(presence.checkedOutAt).toBeInstanceOf(Date);
        expect(presence.checkedOutAt!.getTime()).toBeGreaterThanOrEqual(beforeCheckOut.getTime());
        expect(presence.checkedOutAt!.getTime()).toBeLessThanOrEqual(afterCheckOut.getTime());
        expect(presence.isActive).toBe(false);
      });
    });

    describe('getDurationMinutes', () => {
      it('should calculate duration for checked out presence', () => {
        presence.checkedOutAt = new Date('2023-01-01T12:00:00Z'); // 2 hours later
        const duration = presence.getDurationMinutes();
        
        expect(duration).toBe(120); // 2 hours = 120 minutes
      });

      it('should calculate duration for active presence', () => {
        // Mock the Date constructor to return a specific time
        const mockDate = new Date('2023-01-01T11:00:00Z'); // 1 hour after check-in
        const originalDate = global.Date;
        global.Date = jest.fn(() => mockDate) as any;
        global.Date.now = jest.fn(() => mockDate.getTime());
        
        const duration = presence.getDurationMinutes();
        
        expect(duration).toBe(60); // 1 hour = 60 minutes
        
        global.Date = originalDate;
      });
    });

    describe('isCurrentlyActive', () => {
      it('should return true for active presence without check-out', () => {
        expect(presence.isCurrentlyActive()).toBe(true);
      });

      it('should return false for checked out presence', () => {
        presence.checkOut();
        expect(presence.isCurrentlyActive()).toBe(false);
      });

      it('should return false for inactive presence', () => {
        presence.isActive = false;
        expect(presence.isCurrentlyActive()).toBe(false);
      });
    });

    describe('wasActiveWithin', () => {
      it('should return true for currently active presence', () => {
        expect(presence.wasActiveWithin(30)).toBe(true);
      });

      it('should return true for recently checked out presence', () => {
        presence.checkedOutAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
        presence.isActive = false;
        
        expect(presence.wasActiveWithin(30)).toBe(true);
      });

      it('should return false for old checked out presence', () => {
        presence.checkedOutAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
        presence.isActive = false;
        
        expect(presence.wasActiveWithin(30)).toBe(false);
      });

      it('should return false for presence without check-out time but inactive', () => {
        presence.isActive = false;
        presence.checkedOutAt = undefined;
        
        expect(presence.wasActiveWithin(30)).toBe(false);
      });
    });

    describe('getFormattedDuration', () => {
      it('should format duration in minutes for short durations', () => {
        presence.checkedOutAt = new Date('2023-01-01T10:30:00Z'); // 30 minutes later
        const formatted = presence.getFormattedDuration();
        
        expect(formatted).toBe('30 minutes');
      });

      it('should format duration in hours and minutes for long durations', () => {
        presence.checkedOutAt = new Date('2023-01-01T12:30:00Z'); // 2.5 hours later
        const formatted = presence.getFormattedDuration();
        
        expect(formatted).toBe('2h 30m');
      });

      it('should handle exact hours', () => {
        presence.checkedOutAt = new Date('2023-01-01T12:00:00Z'); // 2 hours later
        const formatted = presence.getFormattedDuration();
        
        expect(formatted).toBe('2h 0m');
      });
    });
  });
});