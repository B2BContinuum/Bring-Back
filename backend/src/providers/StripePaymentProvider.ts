import { PaymentProvider } from '../interfaces/PaymentProvider';
import stripe, { toCents, generateIdempotencyKey } from '../config/stripe';
import Stripe from 'stripe';

/**
 * Stripe implementation of the PaymentProvider interface
 */
export class StripePaymentProvider implements PaymentProvider {
  /**
   * Create a payment intent with Stripe
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    metadata?: Record<string, any>,
    description?: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: toCents(amount),
        currency: currency.toLowerCase(),
        customer: customerId,
        description: description || `Payment of ${amount} ${currency}`,
        metadata: metadata || {},
        capture_method: 'manual', // Important: We'll capture the payment later when items are purchased
        setup_future_usage: 'off_session', // Allow reusing this payment method
      }, {
        idempotencyKey: generateIdempotencyKey(`intent_${customerId}_${amount}`)
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id
      };
    } catch (error: any) {
      console.error('Error creating Stripe payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent from Stripe
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error: any) {
      console.error('Error retrieving Stripe payment intent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Capture a previously authorized payment with Stripe
   */
  async capturePayment(paymentIntentId: string, amount?: number): Promise<boolean> {
    try {
      const captureOptions: Stripe.PaymentIntentCaptureParams = {};
      
      if (amount !== undefined) {
        captureOptions.amount_to_capture = toCents(amount);
      }

      await stripe.paymentIntents.capture(paymentIntentId, captureOptions);
      return true;
    } catch (error: any) {
      console.error('Error capturing Stripe payment:', error);
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Cancel a payment intent with Stripe
   */
  async cancelPayment(paymentIntentId: string): Promise<boolean> {
    try {
      await stripe.paymentIntents.cancel(paymentIntentId);
      return true;
    } catch (error: any) {
      console.error('Error canceling Stripe payment intent:', error);
      throw new Error(`Failed to cancel payment intent: ${error.message}`);
    }
  }

  /**
   * Refund a payment with Stripe
   */
  async refundPayment(paymentIntentId: string, amount?: number, reason?: string): Promise<boolean> {
    try {
      const refundOptions: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: (reason as Stripe.RefundCreateParams.Reason) || 'requested_by_customer'
      };

      if (amount !== undefined) {
        refundOptions.amount = toCents(amount);
      }

      await stripe.refunds.create(refundOptions, {
        idempotencyKey: generateIdempotencyKey(`refund_${paymentIntentId}`)
      });
      
      return true;
    } catch (error: any) {
      console.error('Error refunding Stripe payment:', error);
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Transfer funds to a recipient with Stripe
   */
  async transferFunds(
    amount: number,
    currency: string,
    destinationId: string,
    sourceId: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      await stripe.transfers.create({
        amount: toCents(amount),
        currency: currency.toLowerCase(),
        destination: destinationId,
        source_transaction: sourceId,
        metadata: metadata || {}
      }, {
        idempotencyKey: generateIdempotencyKey(`transfer_${destinationId}_${sourceId}`)
      });
      
      return true;
    } catch (error: any) {
      console.error('Error transferring funds with Stripe:', error);
      throw new Error(`Failed to transfer funds: ${error.message}`);
    }
  }

  /**
   * Create a customer in Stripe
   */
  async createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: metadata || {}
      });
      
      return customer.id;
    } catch (error: any) {
      console.error('Error creating Stripe customer:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Add a payment method to a customer in Stripe
   */
  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean> {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
      
      return true;
    } catch (error: any) {
      console.error('Error attaching payment method with Stripe:', error);
      throw new Error(`Failed to attach payment method: ${error.message}`);
    }
  }

  /**
   * Set a payment method as default for a customer in Stripe
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean> {
    try {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      return true;
    } catch (error: any) {
      console.error('Error setting default payment method with Stripe:', error);
      throw new Error(`Failed to set default payment method: ${error.message}`);
    }
  }

  /**
   * Remove a payment method from Stripe
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
      return true;
    } catch (error: any) {
      console.error('Error detaching payment method with Stripe:', error);
      throw new Error(`Failed to detach payment method: ${error.message}`);
    }
  }

  /**
   * Get payment method details from Stripe
   */
  async getPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error: any) {
      console.error('Error retrieving payment method from Stripe:', error);
      throw new Error(`Failed to retrieve payment method: ${error.message}`);
    }
  }

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhookEvent(payload: any, signature: string, secret: string): Promise<Stripe.Event> {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error: any) {
      console.error('Error handling Stripe webhook event:', error);
      throw new Error(`Webhook Error: ${error.message}`);
    }
  }
}