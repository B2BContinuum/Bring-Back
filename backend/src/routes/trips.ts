import express from 'express';
import { TripController } from '../controllers/TripController';
import { TripService } from '../services/TripService';
import { TripRepository } from '../repositories/TripRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { UserRepository } from '../repositories/UserRepository';

const router = express.Router();

// Initialize repositories
const tripRepository = new TripRepository();
const locationRepository = new LocationRepository();
const userRepository = new UserRepository();

// Initialize services
const tripService = new TripService(
  tripRepository,
  locationRepository,
  userRepository
);

// Initialize controller
const tripController = new TripController(tripService);

// Create a new trip
router.post('/', (req, res) => tripController.createTrip(req, res));

// Get nearby trips
router.get('/nearby', (req, res) => tripController.getNearbyTrips(req, res));

// Get trips by user ID
router.get('/user/:userId', (req, res) => tripController.getUserTrips(req, res));

// Get trip by ID
router.get('/:id', (req, res) => tripController.getTripById(req, res));

// Get trip with details
router.get('/:id/details', (req, res) => tripController.getTripWithDetails(req, res));

// Update trip status
router.put('/:id/status', (req, res) => tripController.updateTripStatus(req, res));

// Update trip capacity
router.put('/:id/capacity', (req, res) => tripController.updateTripCapacity(req, res));

// Cancel trip
router.delete('/:id', (req, res) => tripController.cancelTrip(req, res));

export default router;