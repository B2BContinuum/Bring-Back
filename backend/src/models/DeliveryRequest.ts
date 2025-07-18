import { DeliveryRequest as IDeliveryRequest, RequestStatus, RequestItem, Address } from 'bring-back-shared';

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
   * Calculate total estimated cost including items and delivery fee
   */
  getTotalEstimatedCost(): number {
    const itemsCost = this.items.reduce((total, item) => total + item.estimatedPrice, 0);
    return itemsCost + this.deliveryFee;
  }

  /**
   * Calculate total actual cost if items have been purchased
   */
  getTotalActualCost(): number | null {
    const hasActualPrices = this.items.every(item => item.actualPrice !== undefined);
    if (!hasActualPrices) return null;
    
    const itemsCost = this.items.reduce((total, item) => total + (item.actualPrice || 0), 0);
    return itemsCost + this.deliveryFee;
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
}