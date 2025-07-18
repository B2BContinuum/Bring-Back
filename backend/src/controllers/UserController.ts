import { Request, Response } from 'express';
import { IUserService } from '../services/UserService';
import { User } from '../models/User';

export class UserController {
  constructor(private userService: IUserService) {}

  /**
   * Get user profile
   * GET /api/users/profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // In a real app, userId would come from authenticated session
      const userId = req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const user = await this.userService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Remove sensitive information before sending response
      const userProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        address: user.address,
        rating: user.rating,
        totalDeliveries: user.totalDeliveries,
        verificationStatus: user.verificationStatus,
        createdAt: user.createdAt
      };

      res.status(200).json({
        success: true,
        data: userProfile
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/users/profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // In a real app, userId would come from authenticated session
      const userId = req.body.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Create a copy of the request body and remove userId
      const updates = { ...req.body };
      delete updates.userId; // Remove userId from updates

      // Validate the updates
      const user = new User(updates);
      const validationResult = user.validateProfile();

      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile data',
          details: validationResult.errors
        });
        return;
      }

      const updatedUser = await this.userService.updateUser(userId, updates);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedUser
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user ratings
   * GET /api/users/:id/ratings
   */
  async getUserRatings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Get the user to verify they exist
      const user = await this.userService.getUserById(userId);
      
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Get ratings from repository
      const ratings = await this.userService.getUserRatings(userId, limit);
      
      res.status(200).json({
        success: true,
        data: {
          userId,
          averageRating: user.rating,
          totalRatings: user.totalDeliveries,
          ratings
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Submit a rating for a user
   * POST /api/users/:id/rate
   */
  async rateUser(req: Request, res: Response): Promise<void> {
    try {
      const ratedUserId = req.params.id;
      
      // In a real app, raterUserId would come from authenticated session
      const raterUserId = req.body.raterUserId;
      
      if (!raterUserId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      // Validate rating data
      const { rating, review, deliveryRequestId } = req.body;
      
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          error: 'Rating must be a number between 1 and 5'
        });
        return;
      }
      
      // Check if the rated user exists
      const ratedUser = await this.userService.getUserById(ratedUserId);
      
      if (!ratedUser) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }
      
      // Submit the rating
      const ratingData = {
        ratedUserId,
        raterUserId,
        rating,
        review,
        deliveryRequestId
      };
      
      const newRating = await this.userService.submitRating(ratingData);
      
      res.status(201).json({
        success: true,
        data: newRating
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}