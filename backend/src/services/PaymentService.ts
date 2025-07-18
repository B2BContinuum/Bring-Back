import { Payment as PaymentModel, PaymentStatus, PaymentType } from '../models/Payment';
import { IPaymentRepository } from '../repositories/PaymentRepository';
import { IPaymentMethodRepository } from '../repositories/PaymentMethodRepository';
import { IRequestRepository } from '../repositories/RequestRepository';
import { IUserRepository } from '../repositories/UserRepository';
import { Payment, PaymentInsert } from '../types/database.types';
import { PaymentProvider } from '../interfaces/PaymentProvider';
import { PaymentProviderFactory } from '../providers/PaymentProviderFactory';

export interface IPaymentService {
  // Payment intent management
  createPaymentIntent(requestId: string, amount: number, customerId: string, description?: string): Promise<{ clientSecret: string; paymentIntentId: string }>;
  retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
  cancelPaymentIntent(paymentIntentId: string): Promise<boolean>;
  
  // Payment processing
  authorizePayment(requestId: string, amount: number, customerId: string, description?: string): Promise<PaymentModel>;
  capturePayment(paymentId: string): Promise<PaymentModel | null>;
  refundPayment(paymentId: string, amount?: number, reason?: string): Promise<PaymentModel | null>;
  transferToTraveler(paymentId: string, travelerId: string): Promise<PaymentModel | null>;
  
  // Payment retrieval
  getPaymentById(id: string): Promise<PaymentModel | null>;
  getPaymentsByRequestId(requestId: string): Promise<PaymentModel[]>;
  getPaymentsByCustomerId(customerId: string): Promise<PaymentModel[]>;
  
  // Payment calculation
  calculateTotalCost(requestId: string, tip?: number): Promise<{ itemsCost: number; deliveryFee: number; tip: number; total: number }>;
  
  // Customer management
  createCustomer(userId: string, email: string, name: string): Promise<string>;
  getOrCreateCustomer(userId: string, email: string, name: string): Promise<string>;
  
  // Payment method management
  addPaymentMethod(userId: string, paymentMethodId: string): Promise<any>;
  getPaymentMethods(userId: string): Promise<any[]>;
  setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<boolean>;
  removePaymentMethod(paymentMethodId: string): Promise<boolean>;
}

export class PaymentService implements IPaymentService {
  private paymentProvider: PaymentProvider;

  constructor(
    private paymentRepository: IPaymentRepository,
    private paymentMethodRepository: IPaymentMethodRepository,
    private requestRepository: IRequestRepository,
    private userRepository: IUserRepository,
    providerName: string = 'stripe'
  ) {
    this.paymentProvider = PaymentProviderFactory.getProvider(providerName);
  }

  /**
   * Create a payment intent
   * Requirements: 6.1, 6.2 - Calculate total cost and process payment
   */
  async createPaymentIntent(
    requestId: string, 
    amount: number, 
    customerId: string,
    description?: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!requestId || requestId.trim() === '') {
      throw new Error('Request ID is required');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    if (!customerId || customerId.trim() === '') {
      throw new Error('Customer ID is required');
    }

    try {
      // Create a payment intent using the payment provider
      return await this.paymentProvider.createPaymentIntent(
        amount,
        'usd',
        customerId,
        { requestId, type: 'delivery_payment' },
        description || `Payment for delivery request ${requestId}`
      );
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<any> {
    if (!paymentIntentId || paymentIntentId.trim() === '') {
      throw new Error('Payment intent ID is required');
    }

    try {
      return await this.paymentProvider.retrievePaymentIntent(paymentIntentId);
    } catch (error: any) {
      console.error('Error retrieving payment intent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<boolean> {
    if (!paymentIntentId || paymentIntentId.trim() === '') {
      throw new Error('Payment intent ID is required');
    }

    try {
      return await this.paymentProvider.cancelPayment(paymentIntentId);
    } catch (error: any) {
      console.error('Error canceling payment intent:', error);
      throw new Error(`Failed to cancel payment intent: ${error.message}`);
    }
  }

  /**
   * Authorize payment for a delivery request
   * Requirements: 6.1, 6.2 - Calculate total cost and process payment
   */
  async authorizePayment(
    requestId: string, 
    amount: number, 
    customerId: string,
    description?: string
  ): Promise<PaymentModel> {
    // Verify request exists
    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new Error('Delivery request not found');
    }

    // Create payment intent with Stripe
    const { clientSecret, paymentIntentId } = await this.createPaymentIntent(
      requestId,
      amount,
      customerId,
      description
    );

    // Create payment record in database
    const paymentData: PaymentInsert = {
      request_id: requestId,
      payment_intent_id: paymentIntentId,
      customer_id: customerId,
      amount,
      currency: 'usd',
      status: 'pending',
      type: 'delivery_payment',
      description: description || `Payment for delivery request ${requestId}`,
      metadata: {
        clientSecret
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const dbPayment = await this.paymentRepository.create(paymentData);
    
    // Convert to model
    return this.dbPaymentToModel(dbPayment);
  }

  /**
   * Capture an authorized payment
   * Requirements: 6.2 - Process payment through integrated payment system
   */
  async capturePayment(paymentId: string): Promise<PaymentModel | null> {
    if (!paymentId || paymentId.trim() === '') {
      throw new Error('Payment ID is required');
    }

    // Get payment from database
    const dbPayment = await this.paymentRepository.findById(paymentId);
    if (!dbPayment) {
      throw new Error('Payment not found');
    }

    if (dbPayment.status !== 'authorized') {
      throw new Error('Payment is not in authorized status');
    }

    try {
      // Capture the payment using the payment provider
      await this.paymentProvider.capturePayment(dbPayment.payment_intent_id);

      // Update payment status in database
      const updatedDbPayment = await this.paymentRepository.markAsCaptured(paymentId);
      if (!updatedDbPayment) {
        throw new Error('Failed to update payment status');
      }

      // Convert to model
      return this.dbPaymentToModel(updatedDbPayment);
    } catch (error: any) {
      // Mark payment as failed
      await this.paymentRepository.markAsFailed(paymentId, error.message);
      console.error('Error capturing payment:', error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   * Requirements: 6.4 - Allow partial refunds for unavailable items
   */
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<PaymentModel | null> {
    if (!paymentId || paymentId.trim() === '') {
      throw new Error('Payment ID is required');
    }

    // Get payment from database
    const dbPayment = await this.paymentRepository.findById(paymentId);
    if (!dbPayment) {
      throw new Error('Payment not found');
    }

    if (dbPayment.status !== 'captured' && dbPayment.status !== 'transferred') {
      throw new Error('Payment must be captured or transferred to be refunded');
    }

    try {
      // Refund the payment using the payment provider
      await this.paymentProvider.refundPayment(
        dbPayment.payment_intent_id,
        amount,
        reason
      );

      // Update payment status in database
      const updatedDbPayment = await this.paymentRepository.markAsRefunded(paymentId);
      if (!updatedDbPayment) {
        throw new Error('Failed to update payment status');
      }

      // Create refund record if partial refund
      if (amount && amount < dbPayment.amount) {
        // Create a new payment record for the refund
        const refundData: PaymentInsert = {
          request_id: dbPayment.request_id,
          payment_intent_id: dbPayment.payment_intent_id,
          customer_id: dbPayment.customer_id,
          amount: amount,
          currency: dbPayment.currency,
          status: 'refunded',
          type: 'refund',
          description: reason || `Refund for payment ${paymentId}`,
          metadata: {
            originalPaymentId: paymentId
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          refunded_at: new Date().toISOString()
        };

        await this.paymentRepository.create(refundData);
      }

      // Convert to model
      return this.dbPaymentToModel(updatedDbPayment);
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Transfer funds to traveler
   * Requirements: 6.3 - Transfer delivery compensation to traveler
   */
  async transferToTraveler(paymentId: string, travelerId: string): Promise<PaymentModel | null> {
    if (!paymentId || paymentId.trim() === '') {
      throw new Error('Payment ID is required');
    }

    if (!travelerId || travelerId.trim() === '') {
      throw new Error('Traveler ID is required');
    }

    // Get payment from database
    const dbPayment = await this.paymentRepository.findById(paymentId);
    if (!dbPayment) {
      throw new Error('Payment not found');
    }

    if (dbPayment.status !== 'captured') {
      throw new Error('Payment must be captured to be transferred');
    }

    // Get traveler from database
    const traveler = await this.userRepository.findById(travelerId);
    if (!traveler) {
      throw new Error('Traveler not found');
    }

    // Check if traveler has a connected account
    if (!traveler.stripe_account_id) {
      throw new Error('Traveler does not have a connected payment account');
    }

    try {
      // Get the delivery request to calculate traveler's fee
      const request = await this.requestRepository.findById(dbPayment.request_id);
      if (!request) {
        throw new Error('Delivery request not found');
      }

      // Calculate traveler's fee (delivery fee only)
      const travelerFee = request.delivery_fee;

      // Transfer funds using the payment provider
      await this.paymentProvider.transferFunds(
        travelerFee,
        dbPayment.currency,
        traveler.stripe_account_id,
        dbPayment.payment_intent_id,
        {
          requestId: dbPayment.request_id,
          paymentId: paymentId
        }
      );

      // Update payment status in database
      const updatedDbPayment = await this.paymentRepository.markAsTransferred(paymentId);
      if (!updatedDbPayment) {
        throw new Error('Failed to update payment status');
      }

      // Create a new payment record for the payout
      const payoutData: PaymentInsert = {
        request_id: dbPayment.request_id,
        payment_intent_id: dbPayment.payment_intent_id,
        customer_id: traveler.id, // In this case, the traveler is the "customer" receiving funds
        amount: travelerFee,
        currency: dbPayment.currency,
        status: 'transferred',
        type: 'payout',
        description: `Payout to traveler for delivery request ${dbPayment.request_id}`,
        metadata: {
          originalPaymentId: paymentId,
          travelerId: travelerId
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        transferred_at: new Date().toISOString()
      };

      await this.paymentRepository.create(payoutData);

      // Convert to model
      return this.dbPaymentToModel(updatedDbPayment);
    } catch (error: any) {
      console.error('Error transferring funds to traveler:', error);
      throw new Error(`Failed to transfer funds to traveler: ${error.message}`);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<PaymentModel | null> {
    if (!id || id.trim() === '') {
      throw new Error('Payment ID is required');
    }

    const dbPayment = await this.paymentRepository.findById(id);
    return dbPayment ? this.dbPaymentToModel(dbPayment) : null;
  }

  /**
   * Get payments by request ID
   */
  async getPaymentsByRequestId(requestId: string): Promise<PaymentModel[]> {
    if (!requestId || requestId.trim() === '') {
      throw new Error('Request ID is required');
    }

    const dbPayments = await this.paymentRepository.findByRequestId(requestId);
    return dbPayments.map(payment => this.dbPaymentToModel(payment));
  }

  /**
   * Get payments by customer ID
   */
  async getPaymentsByCustomerId(customerId: string): Promise<PaymentModel[]> {
    if (!customerId || customerId.trim() === '') {
      throw new Error('Customer ID is required');
    }

    const dbPayments = await this.paymentRepository.findByCustomerId(customerId);
    return dbPayments.map(payment => this.dbPaymentToModel(payment));
  }

  /**
   * Calculate total cost for a delivery request
   * Requirements: 6.1 - Calculate total cost (item price + delivery fee + tip)
   */
  async calculateTotalCost(requestId: string, tip: number = 0): Promise<{ 
    itemsCost: number; 
    deliveryFee: number; 
    tip: number; 
    total: number 
  }> {
    if (!requestId || requestId.trim() === '') {
      throw new Error('Request ID is required');
    }

    // Get request from database
    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new Error('Delivery request not found');
    }

    // Calculate items cost
    let itemsCost = 0;
    const items = request.items as any[];
    
    if (Array.isArray(items)) {
      // If items have actual prices, use those; otherwise use estimated prices
      itemsCost = items.reduce((total, item) => {
        const price = item.actualPrice !== undefined ? item.actualPrice : item.estimatedPrice;
        return total + (price * item.quantity);
      }, 0);
    }

    // Get delivery fee
    const deliveryFee = request.delivery_fee;

    // Calculate total
    const total = itemsCost + deliveryFee + tip;

    return {
      itemsCost,
      deliveryFee,
      tip,
      total
    };
  }

  /**
   * Create a payment customer for a user
   */
  async createCustomer(userId: string, email: string, name: string): Promise<string> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!email || email.trim() === '') {
      throw new Error('Email is required');
    }

    try {
      // Create customer using the payment provider
      const customerId = await this.paymentProvider.createCustomer(
        email,
        name,
        { userId }
      );

      // Update user with customer ID
      await this.userRepository.update(userId, {
        stripe_customer_id: customerId // Note: We're still using stripe_customer_id field for now
      });

      return customerId;
    } catch (error: any) {
      console.error('Error creating payment customer:', error);
      throw new Error(`Failed to create payment customer: ${error.message}`);
    }
  }

  /**
   * Get or create a Stripe customer for a user
   */
  async getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    // Get user from database
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If user already has a Stripe customer ID, return it
    if (user.stripe_customer_id) {
      return user.stripe_customer_id;
    }

    // Otherwise, create a new customer
    return this.createCustomer(userId, email, name);
  }

  /**
   * Add a payment method for a user
   */
  async addPaymentMethod(userId: string, paymentMethodId: string): Promise<any> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!paymentMethodId || paymentMethodId.trim() === '') {
      throw new Error('Payment method ID is required');
    }

    // Get user from database
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Ensure user has a customer ID
    if (!user.stripe_customer_id) {
      throw new Error('User does not have a payment customer ID');
    }

    try {
      // Retrieve payment method details using the payment provider
      const paymentMethod = await this.paymentProvider.getPaymentMethod(paymentMethodId);

      // Attach payment method to customer using the payment provider
      await this.paymentProvider.attachPaymentMethod(user.stripe_customer_id, paymentMethodId);

      // Check if this is the first payment method for the user
      const existingMethods = await this.paymentMethodRepository.findByUserId(userId);
      const isDefault = existingMethods.length === 0;

      // If this is the first payment method, set it as the default
      if (isDefault) {
        await this.paymentProvider.setDefaultPaymentMethod(user.stripe_customer_id, paymentMethodId);
      }

      // Create payment method record in database
      const paymentMethodData = {
        user_id: userId,
        payment_method_id: paymentMethodId,
        type: paymentMethod.type,
        last_four: paymentMethod.card?.last4 || '0000',
        brand: paymentMethod.card?.brand || 'unknown',
        exp_month: paymentMethod.card?.exp_month || 1,
        exp_year: paymentMethod.card?.exp_year || 2025,
        is_default: isDefault,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return await this.paymentMethodRepository.create(paymentMethodData);
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }

  /**
   * Get payment methods for a user
   */
  async getPaymentMethods(userId: string): Promise<any[]> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    return await this.paymentMethodRepository.findByUserId(userId);
  }

  /**
   * Set a payment method as default for a user
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<boolean> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!paymentMethodId || paymentMethodId.trim() === '') {
      throw new Error('Payment method ID is required');
    }

    // Get user from database
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Ensure user has a customer ID
    if (!user.stripe_customer_id) {
      throw new Error('User does not have a payment customer ID');
    }

    // Get payment method from database
    const paymentMethod = await this.paymentMethodRepository.findByPaymentMethodId(paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Ensure payment method belongs to user
    if (paymentMethod.user_id !== userId) {
      throw new Error('Payment method does not belong to user');
    }

    try {
      // Update default payment method using the payment provider
      await this.paymentProvider.setDefaultPaymentMethod(user.stripe_customer_id, paymentMethodId);

      // Update payment method in database
      await this.paymentMethodRepository.setDefault(paymentMethod.id, userId);

      return true;
    } catch (error: any) {
      console.error('Error setting default payment method:', error);
      throw new Error(`Failed to set default payment method: ${error.message}`);
    }
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    if (!paymentMethodId || paymentMethodId.trim() === '') {
      throw new Error('Payment method ID is required');
    }

    // Get payment method from database
    const paymentMethod = await this.paymentMethodRepository.findByPaymentMethodId(paymentMethodId);
    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    try {
      // Detach payment method using the payment provider
      await this.paymentProvider.detachPaymentMethod(paymentMethodId);

      // Delete payment method from database
      await this.paymentMethodRepository.delete(paymentMethod.id);

      return true;
    } catch (error: any) {
      console.error('Error removing payment method:', error);
      throw new Error(`Failed to remove payment method: ${error.message}`);
    }
  }

  /**
   * Convert database payment to model payment
   */
  private dbPaymentToModel(dbPayment: Payment): PaymentModel {
    return new PaymentModel({
      id: dbPayment.id,
      requestId: dbPayment.request_id,
      paymentIntentId: dbPayment.payment_intent_id,
      customerId: dbPayment.customer_id,
      amount: dbPayment.amount,
      currency: dbPayment.currency,
      status: this.mapDbPaymentStatusToShared(dbPayment.status),
      type: this.mapDbPaymentTypeToShared(dbPayment.type),
      description: dbPayment.description || undefined,
      metadata: dbPayment.metadata as Record<string, string> || undefined,
      createdAt: new Date(dbPayment.created_at),
      updatedAt: new Date(dbPayment.updated_at),
      capturedAt: dbPayment.captured_at ? new Date(dbPayment.captured_at) : undefined,
      transferredAt: dbPayment.transferred_at ? new Date(dbPayment.transferred_at) : undefined,
      refundedAt: dbPayment.refunded_at ? new Date(dbPayment.refunded_at) : undefined,
      failedAt: dbPayment.failed_at ? new Date(dbPayment.failed_at) : undefined,
      failureReason: dbPayment.failure_reason || undefined
    });
  }

  /**
   * Map database payment status to shared enum
   */
  private mapDbPaymentStatusToShared(dbStatus: string): PaymentStatus {
    switch (dbStatus) {
      case 'pending':
        return PaymentStatus.PENDING;
      case 'authorized':
        return PaymentStatus.AUTHORIZED;
      case 'captured':
        return PaymentStatus.CAPTURED;
      case 'transferred':
        return PaymentStatus.TRANSFERRED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'cancelled':
        return PaymentStatus.CANCELLED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * Map database payment type to shared enum
   */
  private mapDbPaymentTypeToShared(dbType: string): PaymentType {
    switch (dbType) {
      case 'delivery_payment':
        return PaymentType.DELIVERY_PAYMENT;
      case 'refund':
        return PaymentType.REFUND;
      case 'payout':
        return PaymentType.PAYOUT;
      default:
        return PaymentType.DELIVERY_PAYMENT;
    }
  }
}