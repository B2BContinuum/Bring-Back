import { z } from 'zod';
import { validateRequestBody } from '../utils/validation';

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  TRANSFERRED = 'transferred',
  REFUNDED = 'refunded',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentType {
  DELIVERY_PAYMENT = 'delivery_payment',
  REFUND = 'refund',
  PAYOUT = 'payout'
}

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validation schema for payment creation
const paymentCreationSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  amount: z.number().min(0.5, 'Amount must be at least 0.50'),
  currency: z.string().min(3, 'Currency code is required').max(3, 'Currency code must be 3 characters'),
  customerId: z.string().min(1, 'Customer ID is required'),
  description: z.string().optional(),
  metadata: z.record(z.string()).optional()
});

export interface IPayment {
  id: string;
  requestId: string;
  paymentIntentId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  capturedAt?: Date;
  transferredAt?: Date;
  refundedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
}

export class Payment implements IPayment {
  id: string;
  requestId: string;
  paymentIntentId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  capturedAt?: Date;
  transferredAt?: Date;
  refundedAt?: Date;
  failedAt?: Date;
  failureReason?: string;

  constructor(data: Partial<IPayment>) {
    this.id = data.id || '';
    this.requestId = data.requestId || '';
    this.paymentIntentId = data.paymentIntentId || '';
    this.customerId = data.customerId || '';
    this.amount = data.amount || 0;
    this.currency = data.currency || 'usd';
    this.status = data.status || PaymentStatus.PENDING;
    this.type = data.type || PaymentType.DELIVERY_PAYMENT;
    this.description = data.description;
    this.metadata = data.metadata;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.capturedAt = data.capturedAt;
    this.transferredAt = data.transferredAt;
    this.refundedAt = data.refundedAt;
    this.failedAt = data.failedAt;
    this.failureReason = data.failureReason;
  }

  /**
   * Validates payment data for creation
   */
  static validateForCreation(paymentData: Partial<IPayment>): PaymentValidationResult {
    const result = validateRequestBody(paymentCreationSchema, paymentData);
    return {
      isValid: result.success,
      errors: result.success ? [] : result.errors
    };
  }

  /**
   * Validates payment amount
   */
  static validateAmount(amount: number): PaymentValidationResult {
    const errors: string[] = [];
    
    if (amount < 0.5) {
      errors.push('Amount must be at least 0.50');
    }
    
    if (amount > 999999.99) {
      errors.push('Amount exceeds maximum allowed value');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if payment can be captured
   */
  canBeCaptured(): boolean {
    return this.status === PaymentStatus.AUTHORIZED;
  }

  /**
   * Check if payment can be refunded
   */
  canBeRefunded(): boolean {
    return this.status === PaymentStatus.CAPTURED || this.status === PaymentStatus.TRANSFERRED;
  }

  /**
   * Check if payment can be transferred to traveler
   */
  canBeTransferred(): boolean {
    return this.status === PaymentStatus.CAPTURED;
  }

  /**
   * Mark payment as captured
   */
  markAsCaptured(): void {
    if (this.canBeCaptured()) {
      this.status = PaymentStatus.CAPTURED;
      this.capturedAt = new Date();
      this.updatedAt = new Date();
    }
  }

  /**
   * Mark payment as transferred
   */
  markAsTransferred(): void {
    if (this.canBeTransferred()) {
      this.status = PaymentStatus.TRANSFERRED;
      this.transferredAt = new Date();
      this.updatedAt = new Date();
    }
  }

  /**
   * Mark payment as refunded
   */
  markAsRefunded(): void {
    if (this.canBeRefunded()) {
      this.status = PaymentStatus.REFUNDED;
      this.refundedAt = new Date();
      this.updatedAt = new Date();
    }
  }

  /**
   * Mark payment as failed
   */
  markAsFailed(reason: string): void {
    this.status = PaymentStatus.FAILED;
    this.failedAt = new Date();
    this.failureReason = reason;
    this.updatedAt = new Date();
  }

  /**
   * Convert amount to cents for Stripe
   */
  getAmountInCents(): number {
    return Math.round(this.amount * 100);
  }

  /**
   * Get formatted amount with currency symbol
   */
  getFormattedAmount(): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency.toUpperCase()
    });
    
    return formatter.format(this.amount);
  }
}