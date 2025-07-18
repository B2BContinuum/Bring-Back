import express from 'express';
import { RequestController } from '../controllers/RequestController';
import { RequestService } from '../services/RequestService';
import { PaymentService } from '../services/PaymentService';
import { RequestRepository } from '../repositories/RequestRepository';
import { TripRepository } from '../repositories/TripRepository';
import { UserRepository } from '../repositories/UserRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { PaymentMethodRepository } from '../repositories/PaymentMethodRepository';
import { PaymentProviderFactory } from '../providers/PaymentProviderFactory';

const router = express.Router();

// Initialize repositories
const requestRepository = new RequestRepository();
const tripRepository = new TripRepository();
const userRepository = new UserRepository();
const paymentRepository = new PaymentRepository();
const paymentMethodRepository = new PaymentMethodRepository();

// Initialize services
const requestService = new RequestService(
  requestRepository,
  tripRepository,
  userRepository
);

const paymentService = new PaymentService(
  paymentRepository,
  paymentMethodRepository,
  requestRepository,
  userRepository
);

// Get payment provider
const paymentProvider = PaymentProviderFactory.getProvider();

// Initialize controller
const requestController = new RequestController(
  requestService,
  paymentService,
  paymentProvider
);

// Create a new delivery request
router.post('/', (req, res) => requestController.createRequest(req, res));

// Get requests by trip ID
router.get('/for-trip/:tripId', (req, res) => requestController.getRequestsByTripId(req, res));

// Get requests by requester ID
router.get('/by-requester/:requesterId', (req, res) => requestController.getRequestsByRequesterId(req, res));

// Match requests to a trip
router.get('/match/:tripId', (req, res) => requestController.matchRequestsToTrip(req, res));

// Get request by ID
router.get('/:id', (req, res) => requestController.getRequestById(req, res));

// Get request with details
router.get('/:id/details', (req, res) => requestController.getRequestWithDetails(req, res));

// Accept a delivery request
router.put('/:id/accept', (req, res) => requestController.acceptRequest(req, res));

// Update request status
router.put('/:id/status', (req, res) => requestController.updateRequestStatus(req, res));

// Complete a delivery request
router.put('/:id/complete', (req, res) => requestController.completeRequest(req, res));

// Cancel a delivery request
router.delete('/:id', (req, res) => requestController.cancelRequest(req, res));

export default router;