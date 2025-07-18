import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Stripe with API key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// Create Stripe instance with API version
const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2023-10-16', // Use the latest API version or specify a fixed version
  appInfo: {
    name: 'Community Delivery',
    version: '1.0.0'
  }
});

export default stripe;

// Helper function to convert amount to cents for Stripe
export const toCents = (amount: number): number => {
  return Math.round(amount * 100);
};

// Helper function to convert cents to dollars
export const toDollars = (cents: number): number => {
  return cents / 100;
};

// Helper function to generate idempotency key
export const generateIdempotencyKey = (prefix: string = ''): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${timestamp}_${random}`;
};