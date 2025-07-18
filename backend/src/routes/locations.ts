import express from 'express';
import { LocationController } from '../controllers/LocationController';
import { LocationService } from '../services/LocationService';
import { LocationRepository } from '../repositories/LocationRepository';
import { LocationPresenceRepository } from '../repositories/LocationPresenceRepository';

const router = express.Router();

// Initialize repositories
const locationRepository = new LocationRepository();
const locationPresenceRepository = new LocationPresenceRepository();

// Initialize services
const locationService = new LocationService(
  locationRepository,
  locationPresenceRepository
);

// Initialize controller
const locationController = new LocationController(locationService);

// Search locations
router.get('/search', (req, res) => locationController.searchLocations(req, res));

// Get nearby locations
router.get('/nearby', (req, res) => locationController.getNearbyLocations(req, res));

// Get location by ID
router.get('/:id', (req, res) => locationController.getLocationById(req, res));

// Get location presence
router.get('/:id/presence', (req, res) => locationController.getLocationPresence(req, res));

// Check in to location
router.post('/:id/checkin', (req, res) => locationController.checkInToLocation(req, res));

// Check out from location
router.post('/:id/checkout', (req, res) => locationController.checkOutFromLocation(req, res));

export default router;