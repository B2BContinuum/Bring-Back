import express from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';

const router = express.Router();

// Initialize repositories
const userRepository = new UserRepository();

// Initialize services
const userService = new UserService(userRepository);

// Initialize controller
const userController = new UserController(userService);

// Get user profile
router.get('/profile', (req, res) => userController.getProfile(req, res));

// Update user profile
router.put('/profile', (req, res) => userController.updateProfile(req, res));

// Get user ratings
router.get('/:id/ratings', (req, res) => userController.getUserRatings(req, res));

// Submit rating for a user
router.post('/:id/rate', (req, res) => userController.rateUser(req, res));

export default router;