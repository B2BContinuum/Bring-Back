/**
 * Interface for payment providers
 * This allows us to swap out different payment processors without changing the rest of the code
 */
export interface PaymentProvider {
  /**
   * Create a payment intent
   * @param amount Amount to charge in dollars (e.g., 25.99)
   * @param currency Currency code (e.g., 'usd')
   * @param customerId Customer ID in the payment provider's system
   * @param metadata Additional metadata for the payment
   * @param description Description of the payment
   */
  createPaymentIntent(
    amount: number,
    currency: string,
    customerId: string,
    metadata?: Record<string, any>,
    description?: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }>;

  /**
   * Retrieve a payment intent
   * @param paymentIntentId Payment intent ID
   */
  retrievePaymentIntent(paymentIntentId: string): Promise<any>;

  /**
   * Capture a previously authorized payment
   * @param paymentIntentId Payment intent ID
   * @param amount Amount to capture (if different from authorized amount)
   */
  capturePayment(paymentIntentId: string, amount?: number): Promise<boolean>;

  /**
   * Cancel a payment intent
   * @param paymentIntentId Payment intent ID
   */
  cancelPayment(paymentIntentId: string): Promise<boolean>;

  /**
   * Refund a payment
   * @param paymentIntentId Payment intent ID
   * @param amount Amount to refund (if partial refund)
   * @param reason Reason for refund
   */
  refundPayment(paymentIntentId: string, amount?: number, reason?: string): Promise<boolean>;

  /**
   * Transfer funds to a recipient
   * @param amount Amount to transfer
   * @param currency Currency code
   * @param destinationId Recipient's account ID
   * @param sourceId Source transaction ID
   * @param metadata Additional metadata for the transfer
   */
  transferFunds(
    amount: number,
    currency: string,
    destinationId: string,
    sourceId: string,
    metadata?: Record<string, any>
  ): Promise<boolean>;

  /**
   * Create a customer in the payment provider's system
   * @param email Customer's email
   * @param name Customer's name
   * @param metadata Additional metadata for the customer
   */
  createCustomer(
    email: string,
    name: string,
    metadata?: Record<string, any>
  ): Promise<string>;

  /**
   * Add a payment method to a customer
   * @param customerId Customer ID
   * @param paymentMethodId Payment method ID
   */
  attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean>;

  /**
   * Set a payment method as default for a customer
   * @param customerId Customer ID
   * @param paymentMethodId Payment method ID
   */
  setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<boolean>;

  /**
   * Remove a payment method
   * @param paymentMethodId Payment method ID
   */
  detachPaymentMethod(paymentMethodId: string): Promise<boolean>;

  /**
   * Get payment method details
   * @param paymentMethodId Payment method ID
   */
  getPaymentMethod(paymentMethodId: string): Promise<any>;

  /**
   * Handle webhook events from the payment provider
   * @param payload Webhook payload
   * @param signature Webhook signature
   * @param secret Webhook secret
   */
  handleWebhookEvent(payload: any, signature: string, secret: string): Promise<any>;
}