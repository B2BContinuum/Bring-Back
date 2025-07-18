import { PaymentProvider } from '../interfaces/PaymentProvider';
import { StripePaymentProvider } from './StripePaymentProvider';

/**
 * Factory for creating payment providers
 * This allows us to easily switch between different payment providers
 */
export class PaymentProviderFactory {
  /**
   * Get a payment provider instance based on the provider name
   * @param provider Name of the payment provider
   * @returns Payment provider instance
   */
  static getProvider(provider: string = 'stripe'): PaymentProvider {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return new StripePaymentProvider();
      // Add more providers as needed
      // case 'paypal':
      //   return new PayPalPaymentProvider();
      // case 'square':
      //   return new SquarePaymentProvider();
      default:
        // Default to Stripe
        return new StripePaymentProvider();
    }
  }
}