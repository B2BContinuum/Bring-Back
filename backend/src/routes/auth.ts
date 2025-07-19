import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { AuthMiddleware, loginRateLimiter, registrationRateLimiter, passwordResetRateLimiter, verificationCodeRateLimiter } from '../middleware/authMiddleware';
import { sanitizeRequest } from '../middleware/validationMiddleware';
import { UserService } from '../services/UserService';

const router = express.Router();

// Initialize repositories
const userRepository = new UserRepository();

// Initialize services
const userService = new UserService(userRepository);
const authService = new AuthService(userRepository);

// Initialize controllers
const authController = new AuthController(authService);

// Initialize middleware
const authMiddleware = new AuthMiddleware(authService, userService);

// Apply sanitization middleware to all routes
router.use(sanitizeRequest);

// Public routes
router.post('/register', registrationRateLimiter, authController.register.bind(authController));
router.post('/login', loginRateLimiter, authController.login.bind(authController));
router.post('/refresh-token', authController.refreshToken.bind(authController));
router.post('/request-password-reset', passwordResetRateLimiter, authController.requestPasswordReset.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

// Protected routes (require authentication)
router.post('/logout', authMiddleware.authenticate, authController.logout.bind(authController));
router.post('/logout-all', authMiddleware.authenticate, authController.logoutAll.bind(authController));
router.post('/send-email-verification', authMiddleware.authenticate, verificationCodeRateLimiter, authController.sendEmailVerification.bind(authController));
router.post('/verify-email', authMiddleware.authenticate, authController.verifyEmail.bind(authController));
router.post('/send-phone-verification', authMiddleware.authenticate, verificationCodeRateLimiter, authController.sendPhoneVerification.bind(authController));
router.post('/verify-phone', authMiddleware.authenticate, authController.verifyPhone.bind(authController));
router.post('/change-password', authMiddleware.authenticate, authController.changePassword.bind(authController));

export default router;