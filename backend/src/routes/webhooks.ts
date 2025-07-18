import express from 'express';
import { StripeWebhookController } from '../controllers/webhooks/StripeWebhookController';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { RequestRepository } from '../repositories/RequestRepository';
import { UserRepository } from '../repositories/UserRepository';

const router = express.Router();

// Initialize repositories
const paymentRepository = new PaymentRepository();
const requestRepository = new RequestRepository();
const userRepository = new UserRepository();

// Initialize controllers
const stripeWebhookController = new StripeWebhookController(
  paymentRepository,
  requestRepository,
  userRepository
);

// Stripe webhook endpoint
// Note: This endpoint should be raw body parser to verify Stripe signature
router.post('/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  stripeWebhookController.handleWebhook(req, res);
});

export default router;