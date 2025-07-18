import { DeliveryRequest as IDeliveryRequest, RequestStatus, RequestItem, Address } from '../../../shared/src/types';
import { validateRequestBody, createRequestSchema, addressSchema } from '../utils/validation';
import { z } from 'zod';

export interface DeliveryRequestValidationResult {
  isValid: boolean;
  errors: string[];
}

// Enhanced validation schema for DeliveryRequest creation
const deliveryRequestCreationSchema = z.object({
  tripId: z.string().min(1, 'Trip ID is required'),
  requesterId: z.string().min(1, 'Requester ID is required'),
  items: z.array(z.object({
    id: z.string().min(1, 'Item ID is required'),
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    estimatedPrice: z.number().min(0, 'Estimated price cannot be negative'),
    actualPrice: z.number().min(0, 'Actual price cannot be negative').optional(),
    imageUrl: z.string().url('Invalid image URL').optional()
  })).min(1, 'At least one item is required'),
  deliveryAddress: addressSchema,
  maxItemBudget: z.number().min(0, 'Max item budget cannot be negative'),
  deliveryFee: z.number().min(0, 'Delivery fee cannot be negative'),
  specialInstructions: z.string().optional()
}).refine(data => {
  // Ensure total estimated cost doesn't exceed max budget + delivery fee
  const totalEstimatedCost = data.items.reduce((total, item) => total + (item.estimatedPrice * item.quantity), 0);
  return totalEstimatedCost <= data.maxItemBudget;
}, {
  message: 'Total estimated cost of items exceeds maximum budget'
});

export class DeliveryRequest implements IDeliveryRequest {
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

  constructor(data: Partial<IDeliveryRequest>) {
    this.id = data.id || '';
    this.tripId = data.tripId || '';
    this.requesterId = data.requesterId || '';
    this.items = data.items || [];
    this.deliveryAddress = data.deliveryAddress || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };
    this.maxItemBudget = data.maxItemBudget || 0;
    this.deliveryFee = data.deliveryFee || 0;
    this.specialInstructions = data.specialInstructions;
    this.status = data.status || RequestStatus.PENDING;
    this.createdAt = data.createdAt || new Date();
    this.acceptedAt = data.acceptedAt;
    this.completedAt = data.completedAt;
  }

  /**
   * Validates the complete delivery request data for creation
   */
  static validateForCreation(requestData: Partial<IDeliveryRequest>): DeliveryRequestValidationResult {
    const result = validateRequestBody(deliveryRequestCreationSchema, requestData);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates items array
   */
  static validateItems(items: RequestItem[]): DeliveryRequestValidationResult {
    const errors: string[] = [];
    
    if (!items || items.length === 0) {
      errors.push('At least one item is required');
      return { isValid: false, errors };
    }
    
    items.forEach((item, index) => {
      if (!item.name || item.name.trim() === '') {
        errors.push(`Item ${index + 1}: Name is required`);
      }
      
      if (item.quantity < 1) {
        errors.push(`Item ${index + 1}: Quantity must be at least 1`);
      }
      
      if (item.estimatedPrice < 0) {
        errors.push(`Item ${index + 1}: Estimated price cannot be negative`);
      }
      
      if (item.actualPrice !== undefined && item.actualPrice < 0) {
        errors.push(`Item ${index + 1}: Actual price cannot be negative`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates pricing constraints
   */
  static validatePricing(items: RequestItem[], maxItemBudget: number, deliveryFee: number): DeliveryRequestValidationResult {
    const errors: string[] = [];
    
    if (maxItemBudget < 0) {
      errors.push('Max item budget cannot be negative');
    }
    
    if (deliveryFee < 0) {
      errors.push('Delivery fee cannot be negative');
    }
    
    const totalEstimatedCost = items.reduce((total, item) => total + (item.estimatedPrice * item.quantity), 0);
    if (totalEstimatedCost > maxItemBudget) {
      errors.push('Total estimated cost of items exceeds maximum budget');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates the current delivery request instance
   */
  validate(): DeliveryRequestValidationResult {
    return DeliveryRequest.validateForCreation(this);
  }

  /**
   * Validates items for this request instance
   */
  validateItems(): DeliveryRequestValidationResult {
    return DeliveryRequest.validateItems(this.items);
  }

  /**
   * Validates pricing for this request instance
   */
  validatePricing(): DeliveryRequestValidationResult {
    return DeliveryRequest.validatePricing(this.items, this.maxItemBudget, this.deliveryFee);
  }

  /**
   * Calculate total estimated cost including items and delivery fee
   */
  getTotalEstimatedCost(): number {
    const itemsCost = this.items.reduce((total, item) => total + (item.estimatedPrice * item.quantity), 0);
    return Math.round((itemsCost + this.deliveryFee) * 100) / 100;
  }

  /**
   * Calculate total actual cost if items have been purchased
   */
  getTotalActualCost(): number | null {
    const hasActualPrices = this.items.every(item => item.actualPrice !== undefined);
    if (!hasActualPrices) return null;
    
    const itemsCost = this.items.reduce((total, item) => total + ((item.actualPrice || 0) * item.quantity), 0);
    return Math.round((itemsCost + this.deliveryFee) * 100) / 100;
  }

  /**
   * Calculate cost difference between actual and estimated
   */
  getCostDifference(): number | null {
    const actualCost = this.getTotalActualCost();
    if (actualCost === null) return null;
    
    const estimatedCost = this.getTotalEstimatedCost();
    return Math.round((actualCost - estimatedCost) * 100) / 100;
  }

  /**
   * Check if request can be accepted
   */
  canBeAccepted(): boolean {
    return this.status === RequestStatus.PENDING;
  }

  /**
   * Check if request is completed
   */
  isCompleted(): boolean {
    return this.status === RequestStatus.DELIVERED;
  }

  /**
   * Check if request is cancelled
   */
  isCancelled(): boolean {
    return this.status === RequestStatus.CANCELLED;
  }

  /**
   * Check if request is in progress (accepted or purchased)
   */
  isInProgress(): boolean {
    return this.status === RequestStatus.ACCEPTED || this.status === RequestStatus.PURCHASED;
  }

  /**
   * Accept the request
   */
  accept(): void {
    if (this.canBeAccepted()) {
      this.status = RequestStatus.ACCEPTED;
      this.acceptedAt = new Date();
    }
  }

  /**
   * Mark request as purchased
   */
  markAsPurchased(): void {
    if (this.status === RequestStatus.ACCEPTED) {
      this.status = RequestStatus.PURCHASED;
    }
  }

  /**
   * Complete the request
   */
  complete(): void {
    if (this.status === RequestStatus.PURCHASED) {
      this.status = RequestStatus.DELIVERED;
      this.completedAt = new Date();
    }
  }

  /**
   * Cancel the request
   */
  cancel(): void {
    if (this.status === RequestStatus.PENDING || this.status === RequestStatus.ACCEPTED) {
      this.status = RequestStatus.CANCELLED;
    }
  }

  /**
   * Get total number of items
   */
  getTotalItemCount(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Check if all items have actual prices
   */
  hasAllActualPrices(): boolean {
    return this.items.every(item => item.actualPrice !== undefined);
  }

  /**
   * Check if request is within budget
   */
  isWithinBudget(): boolean {
    const actualCost = this.getTotalActualCost();
    if (actualCost === null) {
      // If no actual prices, check estimated cost
      const estimatedItemsCost = this.items.reduce((total, item) => total + (item.estimatedPrice * item.quantity), 0);
      return estimatedItemsCost <= this.maxItemBudget;
    }
    
    const actualItemsCost = actualCost - this.deliveryFee;
    return actualItemsCost <= this.maxItemBudget;
  }
}