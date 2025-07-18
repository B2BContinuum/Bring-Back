import { PaymentService } from '../PaymentService';
import { Payment, PaymentStatus, PaymentType } from '../../models/Payment';
import stripe from '../../config/stripe';

// Mock Stripe
jest.mock('../../config/stripe', () => {
  return {
    __esModule: true,
    default: {
      paymentIntents: {
        create: jest.fn(),
        retrieve: jest.fn(),
        capture: jest.fn(),
        cancel: jest.fn()
      },
      refunds: {
        create: jest.fn()
      },
      transfers: {
        create: jest.fn()
      },
      customers: {
        create: jest.fn(),
        update: jest.fn()
      },
      paymentMethods: {
        retrieve: jest.fn(),
        attach: jest.fn(),
        detach: jest.fn()
      }
    },
    toCents: (amount: number) => Math.round(amount * 100),
    generateIdempotencyKey: jest.fn().mockReturnValue('mock-idempotency-key')
  };
});

// Mock repositories
const mockPaymentRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByRequestId: jest.fn(),
  findByPaymentIntentId: jest.fn(),
  findByCustomerId: jest.fn(),
  findByStatus: jest.fn(),
  updateStatus: jest.fn(),
  markAsCaptured: jest.fn(),
  markAsTransferred: jest.fn(),
  markAsRefunded: jest.fn(),
  markAsFailed: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockPaymentMethodRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findDefaultByUserId: jest.fn(),
  findByPaymentMethodId: jest.fn(),
  setDefault: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockRequestRepository = {
  findById: jest.fn(),
  findByTripId: jest.fn(),
  findByRequesterId: jest.fn(),
  findPendingRequestsForTrip: jest.fn(),
  findAcceptedRequestsForTrip: jest.fn(),
  findMatchingRequests: jest.fn(),
  updateStatus: jest.fn(),
  acceptRequest: jest.fn(),
  completeRequest: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  cancelRequest: jest.fn(),
  getRequestWithDetails: jest.fn(),
  findActiveRequestsByUser: jest.fn(),
  findRequestsByStatus: jest.fn(),
  create: jest.fn()
};

const mockUserRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  updateRating: jest.fn(),
  delete: jest.fn()
};

// Sample data for tests
const samplePayment = {
  id: 'payment-123',
  request_id: 'request-123',
  payment_intent_id: 'pi_123456',
  customer_id: 'cus_123456',
  amount: 25.99,
  currency: 'usd',
  status: 'pending',
  type: 'delivery_payment',
  description: 'Payment for delivery request',
  metadata: { clientSecret: 'cs_test_123' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  captured_at: null,
  transferred_at: null,
  refunded_at: null,
  failed_at: null,
  failure_reason: null
};

const sampleRequest = {
  id: 'request-123',
  trip_id: 'trip-123',
  requester_id: 'user-456',
  items: [
    {
      id: 'item-1',
      name: 'Test Item',
      description: 'Test Description',
      quantity: 2,
      estimatedPrice: 10.99,
      actualPrice: 9.99
    }
  ],
  delivery_address: {
    street: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'Test Country'
  },
  max_item_budget: 30,
  delivery_fee: 5,
  special_instructions: 'Leave at door',
  status: 'accepted',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  accepted_at: new Date().toISOString(),
  completed_at: null
};

const sampleUser = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'Test User',
  phone: '123-456-7890',
  profile_image: null,
  address: null,
  rating: 4.5,
  total_deliveries: 10,
  verification_status: 'verified',
  stripe_customer_id: 'cus_123456',
  stripe_account_id: 'acct_123456',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const samplePaymentMethod = {
  id: 'pm-db-123',
  user_id: 'user-123',
  payment_method_id: 'pm_123456',
  type: 'card',
  last_four: '4242',
  brand: 'visa',
  exp_month: 12,
  exp_year: 2025,
  is_default: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    jest.clearAllMocks();
    paymentService = new PaymentService(
      mockPaymentRepository,
      mockPaymentMethodRepository,
      mockRequestRepository,
      mockUserRepository
    );
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      // Arrange
      const mockPaymentIntent = {
        id: 'pi_123456',
        client_secret: 'cs_test_123',
        status: 'requires_payment_method'
      };
      (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);

      // Act
      const result = await paymentService.createPaymentIntent('request-123', 25.99, 'cus_123456', 'Test payment');

      // Assert
      expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 2599,
          currency: 'usd',
          customer: 'cus_123456',
          description: 'Test payment',
          metadata: expect.objectContaining({
            requestId: 'request-123'
          }),
          capture_method: 'manual'
        }),
        expect.any(Object)
      );
      expect(result).toEqual({
        clientSecret: 'cs_test_123',
        paymentIntentId: 'pi_123456'
      });
    });

    it('should throw error if request ID is empty', async () => {
      // Act & Assert
      await expect(paymentService.createPaymentIntent('', 25.99, 'cus_123456'))
        .rejects.toThrow('Request ID is required');
    });

    it('should throw error if amount is invalid', async () => {
      // Act & Assert
      await expect(paymentService.createPaymentIntent('request-123', 0, 'cus_123456'))
        .rejects.toThrow('Amount must be greater than zero');
    });

    it('should throw error if customer ID is empty', async () => {
      // Act & Assert
      await expect(paymentService.createPaymentIntent('request-123', 25.99, ''))
        .rejects.toThrow('Customer ID is required');
    });

    it('should handle Stripe errors', async () => {
      // Arrange
      (stripe.paymentIntents.create as jest.Mock).mockRejectedValue(new Error('Stripe API error'));

      // Act & Assert
      await expect(paymentService.createPaymentIntent('request-123', 25.99, 'cus_123456'))
        .rejects.toThrow('Failed to create payment intent: Stripe API error');
    });
  });

  describe('authorizePayment', () => {
    it('should authorize payment successfully', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(sampleRequest);
      const mockPaymentIntent = {
        id: 'pi_123456',
        client_secret: 'cs_test_123',
        status: 'requires_payment_method'
      };
      (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockPaymentIntent);
      mockPaymentRepository.create.mockResolvedValue(samplePayment);

      // Act
      const result = await paymentService.authorizePayment('request-123', 25.99, 'cus_123456', 'Test payment');

      // Assert
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('request-123');
      expect(stripe.paymentIntents.create).toHaveBeenCalled();
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        request_id: 'request-123',
        payment_intent_id: 'pi_123456',
        customer_id: 'cus_123456',
        amount: 25.99,
        currency: 'usd',
        status: 'pending',
        type: 'delivery_payment',
        description: 'Test payment'
      }));
      expect(result).toBeInstanceOf(Payment);
      expect(result.id).toBe('payment-123');
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should throw error if request not found', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.authorizePayment('request-123', 25.99, 'cus_123456'))
        .rejects.toThrow('Delivery request not found');
    });
  });

  describe('capturePayment', () => {
    it('should capture payment successfully', async () => {
      // Arrange
      const authorizedPayment = {
        ...samplePayment,
        status: 'authorized'
      };
      mockPaymentRepository.findById.mockResolvedValue(authorizedPayment);
      (stripe.paymentIntents.capture as jest.Mock).mockResolvedValue({
        id: 'pi_123456',
        status: 'succeeded'
      });
      mockPaymentRepository.markAsCaptured.mockResolvedValue({
        ...authorizedPayment,
        status: 'captured',
        captured_at: new Date().toISOString()
      });

      // Act
      const result = await paymentService.capturePayment('payment-123');

      // Assert
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith('payment-123');
      expect(stripe.paymentIntents.capture).toHaveBeenCalledWith('pi_123456', {
        amount_to_capture: 2599
      });
      expect(mockPaymentRepository.markAsCaptured).toHaveBeenCalledWith('payment-123');
      expect(result).toBeInstanceOf(Payment);
      expect(result?.status).toBe(PaymentStatus.CAPTURED);
    });

    it('should throw error if payment not found', async () => {
      // Arrange
      mockPaymentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.capturePayment('payment-123'))
        .rejects.toThrow('Payment not found');
    });

    it('should throw error if payment is not in authorized status', async () => {
      // Arrange
      mockPaymentRepository.findById.mockResolvedValue(samplePayment); // status: 'pending'

      // Act & Assert
      await expect(paymentService.capturePayment('payment-123'))
        .rejects.toThrow('Payment is not in authorized status');
    });

    it('should handle Stripe errors and mark payment as failed', async () => {
      // Arrange
      const authorizedPayment = {
        ...samplePayment,
        status: 'authorized'
      };
      mockPaymentRepository.findById.mockResolvedValue(authorizedPayment);
      (stripe.paymentIntents.capture as jest.Mock).mockRejectedValue(new Error('Stripe API error'));

      // Act & Assert
      await expect(paymentService.capturePayment('payment-123'))
        .rejects.toThrow('Failed to capture payment: Stripe API error');
      expect(mockPaymentRepository.markAsFailed).toHaveBeenCalledWith('payment-123', 'Stripe API error');
    });
  });

  describe('refundPayment', () => {
    it('should refund payment fully', async () => {
      // Arrange
      const capturedPayment = {
        ...samplePayment,
        status: 'captured',
        captured_at: new Date().toISOString()
      };
      mockPaymentRepository.findById.mockResolvedValue(capturedPayment);
      (stripe.refunds.create as jest.Mock).mockResolvedValue({
        id: 're_123456',
        status: 'succeeded'
      });
      mockPaymentRepository.markAsRefunded.mockResolvedValue({
        ...capturedPayment,
        status: 'refunded',
        refunded_at: new Date().toISOString()
      });

      // Act
      const result = await paymentService.refundPayment('payment-123');

      // Assert
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith('payment-123');
      expect(stripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_intent: 'pi_123456',
          amount: 2599
        }),
        expect.any(Object)
      );
      expect(mockPaymentRepository.markAsRefunded).toHaveBeenCalledWith('payment-123');
      expect(result).toBeInstanceOf(Payment);
      expect(result?.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should refund payment partially', async () => {
      // Arrange
      const capturedPayment = {
        ...samplePayment,
        status: 'captured',
        captured_at: new Date().toISOString()
      };
      mockPaymentRepository.findById.mockResolvedValue(capturedPayment);
      (stripe.refunds.create as jest.Mock).mockResolvedValue({
        id: 're_123456',
        status: 'succeeded'
      });
      mockPaymentRepository.markAsRefunded.mockResolvedValue({
        ...capturedPayment,
        status: 'refunded',
        refunded_at: new Date().toISOString()
      });
      mockPaymentRepository.create.mockResolvedValue({
        id: 'refund-123',
        request_id: 'request-123',
        payment_intent_id: 'pi_123456',
        customer_id: 'cus_123456',
        amount: 10,
        currency: 'usd',
        status: 'refunded',
        type: 'refund',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        refunded_at: new Date().toISOString()
      });

      // Act
      const result = await paymentService.refundPayment('payment-123', 10, 'Item unavailable');

      // Assert
      expect(stripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_intent: 'pi_123456',
          amount: 1000,
          reason: 'requested_by_customer'
        }),
        expect.any(Object)
      );
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        request_id: 'request-123',
        payment_intent_id: 'pi_123456',
        customer_id: 'cus_123456',
        amount: 10,
        type: 'refund'
      }));
      expect(result?.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should throw error if payment not found', async () => {
      // Arrange
      mockPaymentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.refundPayment('payment-123'))
        .rejects.toThrow('Payment not found');
    });

    it('should throw error if payment is not in captured or transferred status', async () => {
      // Arrange
      mockPaymentRepository.findById.mockResolvedValue(samplePayment); // status: 'pending'

      // Act & Assert
      await expect(paymentService.refundPayment('payment-123'))
        .rejects.toThrow('Payment must be captured or transferred to be refunded');
    });
  });

  describe('transferToTraveler', () => {
    it('should transfer funds to traveler successfully', async () => {
      // Arrange
      const capturedPayment = {
        ...samplePayment,
        status: 'captured',
        captured_at: new Date().toISOString()
      };
      mockPaymentRepository.findById.mockResolvedValue(capturedPayment);
      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockRequestRepository.findById.mockResolvedValue(sampleRequest);
      (stripe.transfers.create as jest.Mock).mockResolvedValue({
        id: 'tr_123456',
        status: 'succeeded'
      });
      mockPaymentRepository.markAsTransferred.mockResolvedValue({
        ...capturedPayment,
        status: 'transferred',
        transferred_at: new Date().toISOString()
      });
      mockPaymentRepository.create.mockResolvedValue({
        id: 'payout-123',
        request_id: 'request-123',
        payment_intent_id: 'pi_123456',
        customer_id: 'user-123',
        amount: 5,
        currency: 'usd',
        status: 'transferred',
        type: 'payout',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        transferred_at: new Date().toISOString()
      });

      // Act
      const result = await paymentService.transferToTraveler('payment-123', 'user-123');

      // Assert
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith('payment-123');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('request-123');
      expect(stripe.transfers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500, // $5.00 delivery fee
          currency: 'usd',
          destination: 'acct_123456',
          source_transaction: 'pi_123456'
        }),
        expect.any(Object)
      );
      expect(mockPaymentRepository.markAsTransferred).toHaveBeenCalledWith('payment-123');
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        request_id: 'request-123',
        payment_intent_id: 'pi_123456',
        customer_id: 'user-123',
        amount: 5,
        type: 'payout'
      }));
      expect(result).toBeInstanceOf(Payment);
      expect(result?.status).toBe(PaymentStatus.TRANSFERRED);
    });

    it('should throw error if payment not found', async () => {
      // Arrange
      mockPaymentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.transferToTraveler('payment-123', 'user-123'))
        .rejects.toThrow('Payment not found');
    });

    it('should throw error if payment is not in captured status', async () => {
      // Arrange
      mockPaymentRepository.findById.mockResolvedValue(samplePayment); // status: 'pending'

      // Act & Assert
      await expect(paymentService.transferToTraveler('payment-123', 'user-123'))
        .rejects.toThrow('Payment must be captured to be transferred');
    });

    it('should throw error if traveler not found', async () => {
      // Arrange
      const capturedPayment = {
        ...samplePayment,
        status: 'captured',
        captured_at: new Date().toISOString()
      };
      mockPaymentRepository.findById.mockResolvedValue(capturedPayment);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.transferToTraveler('payment-123', 'user-123'))
        .rejects.toThrow('Traveler not found');
    });

    it('should throw error if traveler has no Stripe account', async () => {
      // Arrange
      const capturedPayment = {
        ...samplePayment,
        status: 'captured',
        captured_at: new Date().toISOString()
      };
      mockPaymentRepository.findById.mockResolvedValue(capturedPayment);
      mockUserRepository.findById.mockResolvedValue({
        ...sampleUser,
        stripe_account_id: null
      });

      // Act & Assert
      await expect(paymentService.transferToTraveler('payment-123', 'user-123'))
        .rejects.toThrow('Traveler does not have a connected Stripe account');
    });
  });

  describe('calculateTotalCost', () => {
    it('should calculate total cost correctly with actual prices', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(sampleRequest);

      // Act
      const result = await paymentService.calculateTotalCost('request-123', 2);

      // Assert
      expect(mockRequestRepository.findById).toHaveBeenCalledWith('request-123');
      expect(result).toEqual({
        itemsCost: 19.98, // 2 items at $9.99 each
        deliveryFee: 5,
        tip: 2,
        total: 26.98
      });
    });

    it('should calculate total cost correctly with estimated prices if actual prices not available', async () => {
      // Arrange
      const requestWithoutActualPrices = {
        ...sampleRequest,
        items: [
          {
            id: 'item-1',
            name: 'Test Item',
            description: 'Test Description',
            quantity: 2,
            estimatedPrice: 10.99
          }
        ]
      };
      mockRequestRepository.findById.mockResolvedValue(requestWithoutActualPrices);

      // Act
      const result = await paymentService.calculateTotalCost('request-123');

      // Assert
      expect(result).toEqual({
        itemsCost: 21.98, // 2 items at $10.99 each
        deliveryFee: 5,
        tip: 0,
        total: 26.98
      });
    });

    it('should throw error if request not found', async () => {
      // Arrange
      mockRequestRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.calculateTotalCost('request-123'))
        .rejects.toThrow('Delivery request not found');
    });
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer ID if user has one', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(sampleUser);

      // Act
      const result = await paymentService.getOrCreateCustomer('user-123', 'user@example.com', 'Test User');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toBe('cus_123456');
      expect(stripe.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer if user does not have one', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue({
        ...sampleUser,
        stripe_customer_id: null
      });
      (stripe.customers.create as jest.Mock).mockResolvedValue({
        id: 'cus_new123',
        email: 'user@example.com',
        name: 'Test User'
      });

      // Act
      const result = await paymentService.getOrCreateCustomer('user-123', 'user@example.com', 'Test User');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(stripe.customers.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        name: 'Test User',
        metadata: { userId: 'user-123' }
      });
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', {
        stripe_customer_id: 'cus_new123'
      });
      expect(result).toBe('cus_new123');
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.getOrCreateCustomer('user-123', 'user@example.com', 'Test User'))
        .rejects.toThrow('User not found');
    });
  });

  describe('addPaymentMethod', () => {
    it('should add payment method successfully', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockPaymentMethodRepository.findByUserId.mockResolvedValue([]);
      (stripe.paymentMethods.retrieve as jest.Mock).mockResolvedValue({
        id: 'pm_123456',
        type: 'card',
        card: {
          last4: '4242',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2025
        }
      });
      mockPaymentMethodRepository.create.mockResolvedValue(samplePaymentMethod);

      // Act
      const result = await paymentService.addPaymentMethod('user-123', 'pm_123456');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(stripe.paymentMethods.retrieve).toHaveBeenCalledWith('pm_123456');
      expect(stripe.paymentMethods.attach).toHaveBeenCalledWith('pm_123456', {
        customer: 'cus_123456'
      });
      expect(stripe.customers.update).toHaveBeenCalledWith('cus_123456', {
        invoice_settings: {
          default_payment_method: 'pm_123456'
        }
      });
      expect(mockPaymentMethodRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-123',
        payment_method_id: 'pm_123456',
        type: 'card',
        last_four: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2025,
        is_default: true
      }));
      expect(result).toEqual(samplePaymentMethod);
    });

    it('should not set as default if user already has payment methods', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockPaymentMethodRepository.findByUserId.mockResolvedValue([samplePaymentMethod]);
      (stripe.paymentMethods.retrieve as jest.Mock).mockResolvedValue({
        id: 'pm_new123',
        type: 'card',
        card: {
          last4: '1234',
          brand: 'mastercard',
          exp_month: 11,
          exp_year: 2024
        }
      });
      mockPaymentMethodRepository.create.mockResolvedValue({
        ...samplePaymentMethod,
        id: 'pm-db-456',
        payment_method_id: 'pm_new123',
        last_four: '1234',
        brand: 'mastercard',
        is_default: false
      });

      // Act
      const result = await paymentService.addPaymentMethod('user-123', 'pm_new123');

      // Assert
      expect(stripe.customers.update).not.toHaveBeenCalled();
      expect(mockPaymentMethodRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        is_default: false
      }));
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.addPaymentMethod('user-123', 'pm_123456'))
        .rejects.toThrow('User not found');
    });

    it('should throw error if user has no Stripe customer ID', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue({
        ...sampleUser,
        stripe_customer_id: null
      });

      // Act & Assert
      await expect(paymentService.addPaymentMethod('user-123', 'pm_123456'))
        .rejects.toThrow('User does not have a Stripe customer ID');
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set payment method as default successfully', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockPaymentMethodRepository.findByPaymentMethodId.mockResolvedValue(samplePaymentMethod);
      mockPaymentMethodRepository.setDefault.mockResolvedValue({
        ...samplePaymentMethod,
        is_default: true
      });

      // Act
      const result = await paymentService.setDefaultPaymentMethod('user-123', 'pm_123456');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockPaymentMethodRepository.findByPaymentMethodId).toHaveBeenCalledWith('pm_123456');
      expect(stripe.customers.update).toHaveBeenCalledWith('cus_123456', {
        invoice_settings: {
          default_payment_method: 'pm_123456'
        }
      });
      expect(mockPaymentMethodRepository.setDefault).toHaveBeenCalledWith('pm-db-123', 'user-123');
      expect(result).toBe(true);
    });

    it('should throw error if payment method does not belong to user', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(sampleUser);
      mockPaymentMethodRepository.findByPaymentMethodId.mockResolvedValue({
        ...samplePaymentMethod,
        user_id: 'user-456'
      });

      // Act & Assert
      await expect(paymentService.setDefaultPaymentMethod('user-123', 'pm_123456'))
        .rejects.toThrow('Payment method does not belong to user');
    });
  });

  describe('removePaymentMethod', () => {
    it('should remove payment method successfully', async () => {
      // Arrange
      mockPaymentMethodRepository.findByPaymentMethodId.mockResolvedValue(samplePaymentMethod);

      // Act
      const result = await paymentService.removePaymentMethod('pm_123456');

      // Assert
      expect(mockPaymentMethodRepository.findByPaymentMethodId).toHaveBeenCalledWith('pm_123456');
      expect(stripe.paymentMethods.detach).toHaveBeenCalledWith('pm_123456');
      expect(mockPaymentMethodRepository.delete).toHaveBeenCalledWith('pm-db-123');
      expect(result).toBe(true);
    });

    it('should throw error if payment method not found', async () => {
      // Arrange
      mockPaymentMethodRepository.findByPaymentMethodId.mockResolvedValue(null);

      // Act & Assert
      await expect(paymentService.removePaymentMethod('pm_123456'))
        .rejects.toThrow('Payment method not found');
    });
  });
});