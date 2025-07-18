import { Request, Response } from 'express';
import { UserController } from '../UserController';
import { IUserService } from '../../services/UserService';
import { User } from '../../models/User';
import { VerificationStatus } from '../../../../shared/src/types';
import { UserRating } from '../../types/database.types';

// Mock user service
const mockUserService: jest.Mocked<IUserService> = {
  createUser: jest.fn(),
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  updateUser: jest.fn(),
  updateUserRating: jest.fn(),
  verifyUser: jest.fn(),
  deleteUser: jest.fn(),
  getUserRatings: jest.fn(),
  submitRating: jest.fn()
};

// Mock request and response
const mockRequest = () => {
  const req: Partial<Request> = {
    params: {},
    query: {},
    body: {}
  };
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  return res as Response;
};

describe('UserController', () => {
  let userController: UserController;
  let req: Request;
  let res: Response;

  beforeEach(() => {
    userController = new UserController(mockUserService);
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return 401 if userId is not provided', async () => {
      await userController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });

    it('should return 404 if user is not found', async () => {
      req.query.userId = 'non-existent-id';
      mockUserService.getUserById.mockResolvedValueOnce(null);

      await userController.getProfile(req, res);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    it('should return user profile if user is found', async () => {
      req.query.userId = 'user-123';
      const mockUser = new User({
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '123-456-7890',
        profileImage: 'profile.jpg',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        },
        rating: 4.5,
        totalDeliveries: 10,
        verificationStatus: VerificationStatus.FULLY_VERIFIED,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02')
      });
      
      mockUserService.getUserById.mockResolvedValueOnce(mockUser);

      await userController.getProfile(req, res);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('user-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          phone: '123-456-7890',
          profileImage: 'profile.jpg',
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            country: 'USA'
          },
          rating: 4.5,
          totalDeliveries: 10,
          verificationStatus: VerificationStatus.FULLY_VERIFIED,
          createdAt: new Date('2023-01-01')
        }
      });
    });
  });

  describe('updateProfile', () => {
    it('should return 401 if userId is not provided', async () => {
      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });

    it('should return 400 if profile data is invalid', async () => {
      req.body = {
        userId: 'user-123',
        email: 'invalid-email' // Invalid email format
      };

      await userController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid profile data'
      }));
    });

    it('should return 404 if user is not found', async () => {
      req.body = {
        userId: 'non-existent-id',
        name: 'Updated Name',
        email: 'updated@example.com'
      };
      
      // Mock validateProfile to return valid
      jest.spyOn(User.prototype, 'validateProfile').mockReturnValueOnce({
        isValid: true,
        errors: []
      });
      
      mockUserService.updateUser.mockResolvedValueOnce(null);

      await userController.updateProfile(req, res);

      expect(mockUserService.updateUser).toHaveBeenCalledWith('non-existent-id', expect.objectContaining({
        name: 'Updated Name',
        email: 'updated@example.com'
      }));
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    it('should update user profile successfully', async () => {
      req.body = {
        userId: 'user-123',
        name: 'Updated Name',
        email: 'updated@example.com'
      };
      
      // Mock validateProfile to return valid
      jest.spyOn(User.prototype, 'validateProfile').mockReturnValueOnce({
        isValid: true,
        errors: []
      });
      
      const updatedUser = new User({
        id: 'user-123',
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '123-456-7890',
        rating: 4.5,
        totalDeliveries: 10,
        verificationStatus: VerificationStatus.FULLY_VERIFIED
      });
      
      mockUserService.updateUser.mockResolvedValueOnce(updatedUser);

      await userController.updateProfile(req, res);

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user-123', expect.objectContaining({
        name: 'Updated Name',
        email: 'updated@example.com'
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedUser
      });
    });
  });

  describe('getUserRatings', () => {
    it('should return 404 if user is not found', async () => {
      req.params.id = 'non-existent-id';
      mockUserService.getUserById.mockResolvedValueOnce(null);

      await userController.getUserRatings(req, res);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    it('should return user ratings successfully', async () => {
      req.params.id = 'user-123';
      req.query.limit = '5';
      
      const mockUser = new User({
        id: 'user-123',
        name: 'Test User',
        rating: 4.5,
        totalDeliveries: 10
      });
      
      const mockRatings: UserRating[] = [
        {
          id: 'rating-1',
          rated_user_id: 'user-123',
          rater_user_id: 'user-456',
          delivery_request_id: 'request-1',
          rating: 5,
          review: 'Great service!',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 'rating-2',
          rated_user_id: 'user-123',
          rater_user_id: 'user-789',
          delivery_request_id: 'request-2',
          rating: 4,
          review: 'Good delivery',
          created_at: '2023-01-02T00:00:00Z'
        }
      ];
      
      mockUserService.getUserById.mockResolvedValueOnce(mockUser);
      mockUserService.getUserRatings.mockResolvedValueOnce(mockRatings);

      await userController.getUserRatings(req, res);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('user-123');
      expect(mockUserService.getUserRatings).toHaveBeenCalledWith('user-123', 5);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 'user-123',
          averageRating: 4.5,
          totalRatings: 10,
          ratings: mockRatings
        }
      });
    });
  });

  describe('rateUser', () => {
    it('should return 401 if raterUserId is not provided', async () => {
      req.params.id = 'user-123';
      req.body = {
        rating: 5,
        review: 'Great service!'
      };

      await userController.rateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });

    it('should return 400 if rating is invalid', async () => {
      req.params.id = 'user-123';
      req.body = {
        raterUserId: 'user-456',
        rating: 6, // Invalid rating (> 5)
        review: 'Great service!'
      };

      await userController.rateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Rating must be a number between 1 and 5'
      });
    });

    it('should return 404 if rated user is not found', async () => {
      req.params.id = 'non-existent-id';
      req.body = {
        raterUserId: 'user-456',
        rating: 5,
        review: 'Great service!'
      };
      
      mockUserService.getUserById.mockResolvedValueOnce(null);

      await userController.rateUser(req, res);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('non-existent-id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    it('should submit rating successfully', async () => {
      req.params.id = 'user-123';
      req.body = {
        raterUserId: 'user-456',
        rating: 5,
        review: 'Great service!',
        deliveryRequestId: 'request-1'
      };
      
      const mockUser = new User({
        id: 'user-123',
        name: 'Test User'
      });
      
      const mockRating: UserRating = {
        id: 'rating-1',
        rated_user_id: 'user-123',
        rater_user_id: 'user-456',
        delivery_request_id: 'request-1',
        rating: 5,
        review: 'Great service!',
        created_at: '2023-01-01T00:00:00Z'
      };
      
      mockUserService.getUserById.mockResolvedValueOnce(mockUser);
      mockUserService.submitRating.mockResolvedValueOnce(mockRating);

      await userController.rateUser(req, res);

      expect(mockUserService.getUserById).toHaveBeenCalledWith('user-123');
      expect(mockUserService.submitRating).toHaveBeenCalledWith({
        ratedUserId: 'user-123',
        raterUserId: 'user-456',
        rating: 5,
        review: 'Great service!',
        deliveryRequestId: 'request-1'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockRating
      });
    });
  });
});