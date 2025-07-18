import { DeliveryRequest } from '../DeliveryRequest';
import { RequestStatus } from '../../../../shared/src/types';

describe('DeliveryRequest Model', () => {
  const validRequestData = {
    id: 'request-123',
    tripId: 'trip-123',
    requesterId: 'user-123',
    items: [
      {
        id: 'item-1',
        name: 'Milk',
        description: '1 gallon whole milk',
        quantity: 2,
        estimatedPrice: 4.99,
        imageUrl: 'https://example.com/milk.jpg'
      },
      {
        id: 'item-2',
        name: 'Bread',
        quantity: 1,
        estimatedPrice: 2.50
      }
    ],
    deliveryAddress: {
      street: '456 Oak St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      country: 'USA'
    },
    maxItemBudget: 15.00,
    deliveryFee: 3.00,
    specialInstructions: 'Leave at front door',
    status: RequestStatus.PENDING
  };

  describe('Constructor', () => {
    it('should create a delivery request with valid data', () => {
      const request = new DeliveryRequest(validRequestData);
      
      expect(request.id).toBe(validRequestData.id);
      expect(request.tripId).toBe(validRequestData.tripId);
      expect(request.requesterId).toBe(validRequestData.requesterId);
      expect(request.items).toEqual(validRequestData.items);
      expect(request.deliveryAddress).toEqual(validRequestData.deliveryAddress);
      expect(request.maxItemBudget).toBe(validRequestData.maxItemBudget);
      expect(request.deliveryFee).toBe(validRequestData.deliveryFee);
      expect(request.specialInstructions).toBe(validRequestData.specialInstructions);
      expect(request.status).toBe(validRequestData.status);
    });

    it('should create a delivery request with default values for missing fields', () => {
      const request = new DeliveryRequest({ tripId: 'trip-123', requesterId: 'user-123' });
      
      expect(request.id).toBe('');
      expect(request.tripId).toBe('trip-123');
      expect(request.requesterId).toBe('user-123');
      expect(request.items).toEqual([]);
      expect(request.deliveryAddress).toEqual({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      });
      expect(request.maxItemBudget).toBe(0);
      expect(request.deliveryFee).toBe(0);
      expect(request.specialInstructions).toBeUndefined();
      expect(request.status).toBe(RequestStatus.PENDING);
      expect(request.acceptedAt).toBeUndefined();
      expect(request.completedAt).toBeUndefined();
    });

    it('should set createdAt timestamp', () => {
      const beforeCreate = new Date();
      const request = new DeliveryRequest(validRequestData);
      const afterCreate = new Date();
      
      expect(request.createdAt).toBeInstanceOf(Date);
      expect(request.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(request.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Static Validation Methods', () => {
    describe('validateForCreation', () => {
      it('should validate complete request data successfully', () => {
        const result = DeliveryRequest.validateForCreation(validRequestData);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for missing required fields', () => {
        const incompleteData = { tripId: 'trip-123' };
        const result = DeliveryRequest.validateForCreation(incompleteData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(error => error.includes('requesterId'))).toBe(true);
        expect(result.errors.some(error => error.includes('items'))).toBe(true);
        expect(result.errors.some(error => error.includes('deliveryAddress'))).toBe(true);
      });

      it('should return errors for empty items array', () => {
        const invalidData = {
          ...validRequestData,
          items: []
        };
        const result = DeliveryRequest.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('At least one item is required'))).toBe(true);
      });

      it('should return errors for negative pricing', () => {
        const invalidData = {
          ...validRequestData,
          maxItemBudget: -10,
          deliveryFee: -5
        };
        const result = DeliveryRequest.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('Max item budget cannot be negative'))).toBe(true);
        expect(result.errors.some(error => error.includes('Delivery fee cannot be negative'))).toBe(true);
      });

      it('should return errors when estimated cost exceeds budget', () => {
        const invalidData = {
          ...validRequestData,
          maxItemBudget: 5.00 // Less than total estimated cost (2*4.99 + 1*2.50 = 12.48)
        };
        const result = DeliveryRequest.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('Total estimated cost of items exceeds maximum budget'))).toBe(true);
      });

      it('should return errors for invalid item data', () => {
        const invalidData = {
          ...validRequestData,
          items: [
            {
              id: '',
              name: '',
              quantity: 0,
              estimatedPrice: -1
            }
          ]
        };
        const result = DeliveryRequest.validateForCreation(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateItems', () => {
      it('should validate correct items array', () => {
        const result = DeliveryRequest.validateItems(validRequestData.items);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject empty items array', () => {
        const result = DeliveryRequest.validateItems([]);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('At least one item is required');
      });

      it('should return errors for invalid item properties', () => {
        const invalidItems = [
          {
            id: 'item-1',
            name: '',
            quantity: 0,
            estimatedPrice: -5,
            actualPrice: -2
          }
        ];
        const result = DeliveryRequest.validateItems(invalidItems);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Item 1: Name is required');
        expect(result.errors).toContain('Item 1: Quantity must be at least 1');
        expect(result.errors).toContain('Item 1: Estimated price cannot be negative');
        expect(result.errors).toContain('Item 1: Actual price cannot be negative');
      });

      it('should validate items with actual prices', () => {
        const itemsWithActualPrices = [
          {
            id: 'item-1',
            name: 'Milk',
            quantity: 1,
            estimatedPrice: 4.99,
            actualPrice: 5.49
          }
        ];
        const result = DeliveryRequest.validateItems(itemsWithActualPrices);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('validatePricing', () => {
      it('should validate correct pricing', () => {
        const result = DeliveryRequest.validatePricing(validRequestData.items, 15.00, 3.00);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject negative budget and fees', () => {
        const result = DeliveryRequest.validatePricing(validRequestData.items, -10, -5);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Max item budget cannot be negative');
        expect(result.errors).toContain('Delivery fee cannot be negative');
      });

      it('should reject when estimated cost exceeds budget', () => {
        const result = DeliveryRequest.validatePricing(validRequestData.items, 5.00, 3.00);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Total estimated cost of items exceeds maximum budget');
      });
    });
  });

  describe('Instance Validation Methods', () => {
    let request: DeliveryRequest;

    beforeEach(() => {
      request = new DeliveryRequest(JSON.parse(JSON.stringify(validRequestData)));
    });

    describe('validate', () => {
      it('should validate a valid request instance', () => {
        const result = request.validate();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid request instance', () => {
        request.tripId = '';
        request.items = [];
        request.maxItemBudget = -10;
        
        const result = request.validate();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validateItems', () => {
      it('should validate request items', () => {
        const result = request.validateItems();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid items', () => {
        request.items = [];
        const result = request.validateItems();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('validatePricing', () => {
      it('should validate request pricing', () => {
        const result = request.validatePricing();
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return errors for invalid pricing', () => {
        request.maxItemBudget = 1.00; // Too low for items
        const result = request.validatePricing();
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Cost Calculation Methods', () => {
    let request: DeliveryRequest;

    beforeEach(() => {
      request = new DeliveryRequest(JSON.parse(JSON.stringify(validRequestData)));
    });

    describe('getTotalEstimatedCost', () => {
      it('should calculate total estimated cost including delivery fee', () => {
        const totalCost = request.getTotalEstimatedCost();
        
        // (2 * 4.99) + (1 * 2.50) + 3.00 = 9.98 + 2.50 + 3.00 = 15.48
        expect(totalCost).toBe(15.48);
      });

      it('should handle empty items array', () => {
        request.items = [];
        const totalCost = request.getTotalEstimatedCost();
        
        expect(totalCost).toBe(3.00); // Only delivery fee
      });
    });

    describe('getTotalActualCost', () => {
      it('should return null when not all items have actual prices', () => {
        const actualCost = request.getTotalActualCost();
        
        expect(actualCost).toBeNull();
      });

      it('should calculate total actual cost when all items have actual prices', () => {
        request.items[0].actualPrice = 5.49;
        request.items[1].actualPrice = 2.99;
        
        const actualCost = request.getTotalActualCost();
        
        // (2 * 5.49) + (1 * 2.99) + 3.00 = 10.98 + 2.99 + 3.00 = 16.97
        expect(actualCost).toBe(16.97);
      });

      it('should handle empty items array with actual prices', () => {
        request.items = [];
        const actualCost = request.getTotalActualCost();
        
        expect(actualCost).toBe(3.00); // Only delivery fee
      });
    });

    describe('getCostDifference', () => {
      it('should return null when actual cost is not available', () => {
        const difference = request.getCostDifference();
        
        expect(difference).toBeNull();
      });

      it('should calculate cost difference when actual prices are available', () => {
        request.items[0].actualPrice = 5.49;
        request.items[1].actualPrice = 2.99;
        
        const difference = request.getCostDifference();
        
        // Actual: 16.97, Estimated: 15.48, Difference: 1.49
        expect(difference).toBe(1.49);
      });

      it('should return negative difference when actual cost is lower', () => {
        request.items[0].actualPrice = 4.00;
        request.items[1].actualPrice = 2.00;
        
        const difference = request.getCostDifference();
        
        // Actual: 13.00, Estimated: 15.48, Difference: -2.48
        expect(difference).toBe(-2.48);
      });
    });
  });

  describe('Status Check Methods', () => {
    let request: DeliveryRequest;

    beforeEach(() => {
      request = new DeliveryRequest(JSON.parse(JSON.stringify(validRequestData)));
    });

    describe('canBeAccepted', () => {
      it('should return true for pending requests', () => {
        request.status = RequestStatus.PENDING;
        expect(request.canBeAccepted()).toBe(true);
      });

      it('should return false for non-pending requests', () => {
        const nonPendingStatuses = [RequestStatus.ACCEPTED, RequestStatus.PURCHASED, RequestStatus.DELIVERED, RequestStatus.CANCELLED];
        
        nonPendingStatuses.forEach(status => {
          request.status = status;
          expect(request.canBeAccepted()).toBe(false);
        });
      });
    });

    describe('isCompleted', () => {
      it('should return true for delivered requests', () => {
        request.status = RequestStatus.DELIVERED;
        expect(request.isCompleted()).toBe(true);
      });

      it('should return false for non-delivered requests', () => {
        const nonDeliveredStatuses = [RequestStatus.PENDING, RequestStatus.ACCEPTED, RequestStatus.PURCHASED, RequestStatus.CANCELLED];
        
        nonDeliveredStatuses.forEach(status => {
          request.status = status;
          expect(request.isCompleted()).toBe(false);
        });
      });
    });

    describe('isCancelled', () => {
      it('should return true for cancelled requests', () => {
        request.status = RequestStatus.CANCELLED;
        expect(request.isCancelled()).toBe(true);
      });

      it('should return false for non-cancelled requests', () => {
        const nonCancelledStatuses = [RequestStatus.PENDING, RequestStatus.ACCEPTED, RequestStatus.PURCHASED, RequestStatus.DELIVERED];
        
        nonCancelledStatuses.forEach(status => {
          request.status = status;
          expect(request.isCancelled()).toBe(false);
        });
      });
    });

    describe('isInProgress', () => {
      it('should return true for in-progress requests', () => {
        const inProgressStatuses = [RequestStatus.ACCEPTED, RequestStatus.PURCHASED];
        
        inProgressStatuses.forEach(status => {
          request.status = status;
          expect(request.isInProgress()).toBe(true);
        });
      });

      it('should return false for non-in-progress requests', () => {
        const notInProgressStatuses = [RequestStatus.PENDING, RequestStatus.DELIVERED, RequestStatus.CANCELLED];
        
        notInProgressStatuses.forEach(status => {
          request.status = status;
          expect(request.isInProgress()).toBe(false);
        });
      });
    });
  });

  describe('Status Management Methods', () => {
    let request: DeliveryRequest;

    beforeEach(() => {
      request = new DeliveryRequest(JSON.parse(JSON.stringify(validRequestData)));
    });

    describe('accept', () => {
      it('should accept pending requests', () => {
        request.status = RequestStatus.PENDING;
        const beforeAccept = new Date();
        
        request.accept();
        
        const afterAccept = new Date();
        expect(request.status).toBe(RequestStatus.ACCEPTED);
        expect(request.acceptedAt).toBeInstanceOf(Date);
        expect(request.acceptedAt!.getTime()).toBeGreaterThanOrEqual(beforeAccept.getTime());
        expect(request.acceptedAt!.getTime()).toBeLessThanOrEqual(afterAccept.getTime());
      });

      it('should not accept non-pending requests', () => {
        request.status = RequestStatus.ACCEPTED;
        const originalAcceptedAt = request.acceptedAt;
        
        request.accept();
        
        expect(request.status).toBe(RequestStatus.ACCEPTED);
        expect(request.acceptedAt).toBe(originalAcceptedAt);
      });
    });

    describe('markAsPurchased', () => {
      it('should mark accepted requests as purchased', () => {
        request.status = RequestStatus.ACCEPTED;
        
        request.markAsPurchased();
        
        expect(request.status).toBe(RequestStatus.PURCHASED);
      });

      it('should not mark non-accepted requests as purchased', () => {
        request.status = RequestStatus.PENDING;
        
        request.markAsPurchased();
        
        expect(request.status).toBe(RequestStatus.PENDING);
      });
    });

    describe('complete', () => {
      it('should complete purchased requests', () => {
        request.status = RequestStatus.PURCHASED;
        const beforeComplete = new Date();
        
        request.complete();
        
        const afterComplete = new Date();
        expect(request.status).toBe(RequestStatus.DELIVERED);
        expect(request.completedAt).toBeInstanceOf(Date);
        expect(request.completedAt!.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
        expect(request.completedAt!.getTime()).toBeLessThanOrEqual(afterComplete.getTime());
      });

      it('should not complete non-purchased requests', () => {
        request.status = RequestStatus.ACCEPTED;
        const originalCompletedAt = request.completedAt;
        
        request.complete();
        
        expect(request.status).toBe(RequestStatus.ACCEPTED);
        expect(request.completedAt).toBe(originalCompletedAt);
      });
    });

    describe('cancel', () => {
      it('should cancel pending requests', () => {
        request.status = RequestStatus.PENDING;
        
        request.cancel();
        
        expect(request.status).toBe(RequestStatus.CANCELLED);
      });

      it('should cancel accepted requests', () => {
        request.status = RequestStatus.ACCEPTED;
        
        request.cancel();
        
        expect(request.status).toBe(RequestStatus.CANCELLED);
      });

      it('should not cancel purchased or delivered requests', () => {
        const nonCancellableStatuses = [RequestStatus.PURCHASED, RequestStatus.DELIVERED];
        
        nonCancellableStatuses.forEach(status => {
          request.status = status;
          const originalStatus = request.status;
          
          request.cancel();
          
          expect(request.status).toBe(originalStatus);
        });
      });
    });
  });

  describe('Utility Methods', () => {
    let request: DeliveryRequest;

    beforeEach(() => {
      request = new DeliveryRequest(JSON.parse(JSON.stringify(validRequestData)));
    });

    describe('getTotalItemCount', () => {
      it('should calculate total quantity of all items', () => {
        const totalCount = request.getTotalItemCount();
        
        // 2 milk + 1 bread = 3 total items
        expect(totalCount).toBe(3);
      });

      it('should return 0 for empty items array', () => {
        request.items = [];
        const totalCount = request.getTotalItemCount();
        
        expect(totalCount).toBe(0);
      });
    });

    describe('hasAllActualPrices', () => {
      it('should return false when not all items have actual prices', () => {
        expect(request.hasAllActualPrices()).toBe(false);
      });

      it('should return true when all items have actual prices', () => {
        request.items[0].actualPrice = 5.49;
        request.items[1].actualPrice = 2.99;
        
        expect(request.hasAllActualPrices()).toBe(true);
      });

      it('should return true for empty items array', () => {
        request.items = [];
        
        expect(request.hasAllActualPrices()).toBe(true);
      });
    });

    describe('isWithinBudget', () => {
      it('should return true when estimated cost is within budget', () => {
        expect(request.isWithinBudget()).toBe(true);
      });

      it('should return false when estimated cost exceeds budget', () => {
        request.maxItemBudget = 5.00; // Less than estimated cost
        
        expect(request.isWithinBudget()).toBe(false);
      });

      it('should check actual cost when available', () => {
        request.items[0].actualPrice = 10.00; // High actual price
        request.items[1].actualPrice = 10.00; // High actual price
        
        expect(request.isWithinBudget()).toBe(false);
      });

      it('should return true when actual cost is within budget', () => {
        request.items[0].actualPrice = 3.00; // Lower actual price
        request.items[1].actualPrice = 1.00; // Lower actual price
        
        expect(request.isWithinBudget()).toBe(true);
      });
    });
  });
});