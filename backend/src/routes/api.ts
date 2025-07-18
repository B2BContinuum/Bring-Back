import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { TripController } from '../controllers/TripController';
import { RequestController } from '../controllers/RequestController';
import { LocationController } from '../controllers/LocationController';

const router = Router();

// Initialize controllers
const userController = new UserController();
const tripController = new TripController();
const requestController = new RequestController();
const locationController = new LocationController();

// User routes
router.get('/users/profile', userController.getUserProfile);
router.put('/users/profile', userController.updateUserProfile);
router.get('/users/:id/ratings', userController.getUserRatings);
router.post('/users/:id/rate', userController.rateUser);

// Trip routes
router.post('/trips', tripController.createTrip);
router.get('/trips/nearby', tripController.getNearbyTrips);
router.put('/trips/:id/status', tripController.updateTripStatus);
router.delete('/trips/:id', tripController.cancelTrip);

// Request routes
router.post('/requests', requestController.createRequest);
router.get('/requests/for-trip/:tripId', requestController.getRequestsForTrip);
router.put('/requests/:id/accept', requestController.acceptRequest);
router.put('/requests/:id/status', requestController.updateRequestStatus);

// Location routes
router.get('/locations/search', locationController.searchLocations);
router.get('/locations/:id/presence', locationController.getLocationPresence);
router.get('/locations/nearby', locationController.getNearbyLocations);
router.post('/locations/:id/checkin', locationController.checkInToLocation);
router.post('/locations/:id/checkout', locationController.checkOutFromLocation);

export default router;