import { Request, Response } from 'express';
import Stripe from 'stripe';
import stripe from '../../config/stripe';
import { IPaymentRepository } from '../../repositories/PaymentRepository';
import { IRequestRepository } from '../../repositories/RequestRepository';
import { IUserRepository } from '../../repositories/UserRepository';

export class StripeWebhookController {
  constructor(
    private paymentRepository: IPaymentRepository,
    private requestRepository: IRequestRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      res.status(400).send('Missing Stripe signature');
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not defined');
      res.status(500).send('Webhook secret not configured');
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    try {
      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).send({ received: true });
    } catch (err: any) {
      console.error(`Error processing webhook: ${err.message}`);
      res.status(500).send(`Webhook processing error: ${err.message}`);
    }
  }

  /**
   * Handle payment_intent.succeeded event
   */
  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
    
    // Find payment by payment intent ID
    const payment = await this.paymentRepository.findByPaymentIntentId(paymentIntent.id);
    
    if (!payment) {
      console.error(`Payment not found for PaymentIntent ${paymentIntent.id}`);
      return;
    }

    // If payment is in pending status, update to authorized
    if (payment.status === 'pending') {
      await this.paymentRepository.updateStatus(payment.id, 'authorized');
    }
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`PaymentIntent ${paymentIntent.id} failed`);
    
    // Find payment by payment intent ID
    const payment = await this.paymentRepository.findByPaymentIntentId(paymentIntent.id);
    
    if (!payment) {
      console.error(`Payment not found for PaymentIntent ${paymentIntent.id}`);
      return;
    }

    // Update payment status to failed
    const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
    await this.paymentRepository.markAsFailed(payment.id, failureMessage);
  }

  /**
   * Handle payment_intent.canceled event
   */
  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    console.log(`PaymentIntent ${paymentIntent.id} canceled`);
    
    // Find payment by payment intent ID
    const payment = await this.paymentRepository.findByPaymentIntentId(paymentIntent.id);
    
    if (!payment) {
      console.error(`Payment not found for PaymentIntent ${paymentIntent.id}`);
      return;
    }

    // Update payment status to cancelled
    await this.paymentRepository.updateStatus(payment.id, 'cancelled');
  }

  /**
   * Handle charge.refunded event
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    console.log(`Charge ${charge.id} refunded`);
    
    // Find payment by payment intent ID
    const paymentIntentId = charge.payment_intent as string;
    const payment = await this.paymentRepository.findByPaymentIntentId(paymentIntentId);
    
    if (!payment) {
      console.error(`Payment not found for PaymentIntent ${paymentIntentId}`);
      return;
    }

    // Update payment status to refunded
    await this.paymentRepository.markAsRefunded(payment.id);
  }
}