import { UserService, RatingSubmission } from '../UserService';
import { IUserRepository } from '../../repositories/UserRepository';
import { User } from '../../models/User';
import { VerificationStatus } from '../../../../shared/src/types';
import { UserRating } from '../../types/database.types';

// Mock user repository
const mockUserRepository: jest.Mocked<IUserRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByPhone: jest.fn(),
  update: jest.fn(),
  updateRating: jest.fn(),
  updateVerificationStatus: jest.fn(),
  delete: jest.fn(),
  addRating: jest.fn(),
  getUserRatings: jest.fn(),
  getUserAverageRating: jest.fn()
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService(mockUserRepository);
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return null if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      const result = await userService.getUserById('non-existent-id');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return user if found', async () => {
      const mockDbUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '123-456-7890',
        profile_image: 'profile.jpg',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        },
        rating: 4.5,
        total_deliveries: 10,
        verification_status: 'verified' as const,
        stripe_customer_id: 'cus_123',
        stripe_account_id: 'acct_123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z'
      };

      mockUserRepository.findById.mockResolvedValueOnce(mockDbUser);

      const result = await userService.getUserById('user-123');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toBeInstanceOf(User);
      expect(result?.id).toBe('user-123');
      expect(result?.email).toBe('test@example.com');
      expect(result?.name).toBe('Test User');
      expect(result?.verificationStatus).toBe(VerificationStatus.FULLY_VERIFIED);
    });
  });

  describe('updateUser', () => {
    it('should return null if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      const result = await userService.updateUser('non-existent-id', { name: 'Updated Name' });

      expect(mockUserRepository.findById).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });

    it('should update user successfully', async () => {
      const mockDbUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        phone: '123-456-7890',
        profile_image: null,
        address: null,
        rating: 0,
        total_deliveries: 0,
        verification_status: 'pending' as const,
        stripe_customer_id: null,
        stripe_account_id: null,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockUpdatedDbUser = {
        ...mockDbUser,
        name: 'Updated Name',
        email: 'updated@example.com',
        updated_at: expect.any(String)
      };

      mockUserRepository.findById.mockResolvedValueOnce(mockDbUser);
      mockUserRepository.update.mockResolvedValueOnce(mockUpdatedDbUser);

      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const result = await userService.updateUser('user-123', updates);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', expect.objectContaining({
        name: 'Updated Name',
        email: 'updated@example.com',
        updated_at: expect.any(String)
      }));
      expect(result?.name).toBe('Updated Name');
      expect(result?.email).toBe('updated@example.com');
    });
  });

  describe('getUserRatings', () => {
    it('should return user ratings', async () => {
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

      mockUserRepository.getUserRatings.mockResolvedValueOnce(mockRatings);

      const result = await userService.getUserRatings('user-123', 5);

      expect(mockUserRepository.getUserRatings).toHaveBeenCalledWith('user-123', 5);
      expect(result).toEqual(mockRatings);
    });
  });

  describe('submitRating', () => {
    it('should throw error if rating is invalid', async () => {
      const ratingData: RatingSubmission = {
        ratedUserId: 'user-123',
        raterUserId: 'user-456',
        rating: 6, // Invalid rating (> 5)
        review: 'Great service!'
      };

      await expect(userService.submitRating(ratingData)).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should throw error if rated user is not found', async () => {
      const ratingData: RatingSubmission = {
        ratedUserId: 'non-existent-id',
        raterUserId: 'user-456',
        rating: 5,
        review: 'Great service!'
      };

      mockUserRepository.findById.mockResolvedValueOnce(null);

      await expect(userService.submitRating(ratingData)).rejects.toThrow('Rated user not found');
    });

    it('should throw error if rater user is not found', async () => {
      const ratingData: RatingSubmission = {
        ratedUserId: 'user-123',
        raterUserId: 'non-existent-id',
        rating: 5,
        review: 'Great service!'
      };

      mockUserRepository.findById.mockResolvedValueOnce({} as any); // Rated user exists
      mockUserRepository.findById.mockResolvedValueOnce(null); // Rater user doesn't exist

      await expect(userService.submitRating(ratingData)).rejects.toThrow('Rater user not found');
    });

    it('should submit rating successfully', async () => {
      const ratingData: RatingSubmission = {
        ratedUserId: 'user-123',
        raterUserId: 'user-456',
        rating: 5,
        review: 'Great service!',
        deliveryRequestId: 'request-1'
      };

      const mockRating: UserRating = {
        id: 'rating-1',
        rated_user_id: 'user-123',
        rater_user_id: 'user-456',
        delivery_request_id: 'request-1',
        rating: 5,
        review: 'Great service!',
        created_at: '2023-01-01T00:00:00Z'
      };

      mockUserRepository.findById.mockResolvedValueOnce({} as any); // Rated user exists
      mockUserRepository.findById.mockResolvedValueOnce({} as any); // Rater user exists
      mockUserRepository.addRating.mockResolvedValueOnce(mockRating);
      mockUserRepository.getUserAverageRating.mockResolvedValueOnce(4.5);
      
      // Mock updateUserRating instead of directly calling updateRating
      jest.spyOn(userService, 'updateUserRating').mockResolvedValueOnce({} as any);

      const result = await userService.submitRating(ratingData);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-456');
      expect(mockUserRepository.addRating).toHaveBeenCalledWith(expect.objectContaining({
        rated_user_id: 'user-123',
        rater_user_id: 'user-456',
        rating: 5,
        review: 'Great service!',
        delivery_request_id: 'request-1'
      }));
      expect(mockUserRepository.getUserAverageRating).toHaveBeenCalledWith('user-123');
      expect(userService.updateUserRating).toHaveBeenCalledWith('user-123', 4.5);
      expect(result).toEqual(mockRating);
    });
  });
});