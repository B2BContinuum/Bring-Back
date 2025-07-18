import { UserRepository } from '../UserRepository';
import { supabaseAdmin } from '../../config/database';
import { VerificationStatus } from '../../../../shared/src/types';
import { UserInsert, UserRatingInsert } from '../../types/database.types';

// Mock the database config
jest.mock('../../config/database', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockSupabaseAdmin: any;

  beforeEach(() => {
    // Reset the mock before each test
    mockSupabaseAdmin = {
      from: jest.fn()
    };
    (supabaseAdmin as any) = mockSupabaseAdmin;
    
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData: UserInsert = {
        email: 'test@example.com',
        name: 'Test User',
        phone: '+1234567890',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      };

      const expectedUser = {
        id: 'user-123',
        ...userData,
        rating: 0,
        total_deliveries: 0,
        verification_status: 'pending',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedUser, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.create(userData);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users');
      expect(mockChain.insert).toHaveBeenCalledWith(userData);
      expect(mockChain.select).toHaveBeenCalled();
      expect(mockChain.single).toHaveBeenCalled();
      expect(result).toEqual(expectedUser);
    });

    it('should throw error when database connection is not available', async () => {
      (supabaseAdmin as any) = null;
      userRepository = new UserRepository();

      const userData: UserInsert = {
        email: 'test@example.com',
        name: 'Test User'
      };

      await expect(userRepository.create(userData)).rejects.toThrow('Database connection not available');
    });

    it('should throw error when database operation fails', async () => {
      const userData: UserInsert = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      await expect(userRepository.create(userData)).rejects.toThrow('Failed to create user: Database error');
    });
  });

  describe('findById', () => {
    it('should find user by ID successfully', async () => {
      const userId = 'user-123';
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        rating: 4.5,
        total_deliveries: 10
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedUser, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.findById(userId);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('users');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.eq).toHaveBeenCalledWith('id', userId);
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent-user';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      const email = 'test@example.com';
      const expectedUser = {
        id: 'user-123',
        email,
        name: 'Test User'
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedUser, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.findByEmail(email);

      expect(mockChain.eq).toHaveBeenCalledWith('email', email);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 'user-123';
      const updates = { name: 'Updated Name' };
      const expectedUser = {
        id: userId,
        name: 'Updated Name',
        updated_at: expect.any(String)
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedUser, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.update(userId, updates);

      expect(mockChain.update).toHaveBeenCalledWith({
        ...updates,
        updated_at: expect.any(String)
      });
      expect(mockChain.eq).toHaveBeenCalledWith('id', userId);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('updateRating', () => {
    it('should update user rating successfully', async () => {
      const userId = 'user-123';
      const rating = 4.5;
      const totalDeliveries = 10;

      const expectedUser = {
        id: userId,
        rating,
        total_deliveries: totalDeliveries
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedUser, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.updateRating(userId, rating, totalDeliveries);

      expect(mockChain.update).toHaveBeenCalledWith({
        rating,
        total_deliveries: totalDeliveries,
        updated_at: expect.any(String)
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('updateVerificationStatus', () => {
    it('should update verification status successfully', async () => {
      const userId = 'user-123';
      const status = VerificationStatus.FULLY_VERIFIED;

      const expectedUser = {
        id: userId,
        verification_status: 'verified'
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedUser, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.updateVerificationStatus(userId, status);

      expect(mockChain.update).toHaveBeenCalledWith({
        verification_status: 'verified',
        updated_at: expect.any(String)
      });
      expect(result).toEqual(expectedUser);
    });

    it('should map verification status correctly', async () => {
      const userId = 'user-123';
      
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: {}, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      // Test UNVERIFIED -> pending
      await userRepository.updateVerificationStatus(userId, VerificationStatus.UNVERIFIED);
      expect(mockChain.update).toHaveBeenCalledWith({
        verification_status: 'pending',
        updated_at: expect.any(String)
      });

      // Test FULLY_VERIFIED -> verified
      await userRepository.updateVerificationStatus(userId, VerificationStatus.FULLY_VERIFIED);
      expect(mockChain.update).toHaveBeenCalledWith({
        verification_status: 'verified',
        updated_at: expect.any(String)
      });
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-123';

      const mockChain = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.delete(userId);

      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', userId);
      expect(result).toBe(true);
    });
  });

  describe('addRating', () => {
    it('should add rating successfully', async () => {
      const ratingData: UserRatingInsert = {
        rated_user_id: 'user-123',
        rater_user_id: 'rater-456',
        rating: 5,
        review: 'Great service!'
      };

      const expectedRating = {
        id: 'rating-789',
        ...ratingData,
        created_at: '2023-01-01T00:00:00Z'
      };

      const mockChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: expectedRating, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.addRating(ratingData);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('user_ratings');
      expect(mockChain.insert).toHaveBeenCalledWith(ratingData);
      expect(result).toEqual(expectedRating);
    });
  });

  describe('getUserRatings', () => {
    it('should get user ratings successfully', async () => {
      const userId = 'user-123';
      const expectedRatings = [
        { id: 'rating-1', rating: 5, review: 'Great!' },
        { id: 'rating-2', rating: 4, review: 'Good' }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: expectedRatings, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.getUserRatings(userId, 5);

      expect(mockChain.eq).toHaveBeenCalledWith('rated_user_id', userId);
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual(expectedRatings);
    });
  });

  describe('getUserAverageRating', () => {
    it('should calculate average rating correctly', async () => {
      const userId = 'user-123';
      const ratingsData = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: ratingsData, error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.getUserAverageRating(userId);

      expect(mockChain.select).toHaveBeenCalledWith('rating');
      expect(mockChain.eq).toHaveBeenCalledWith('rated_user_id', userId);
      expect(result).toBe(4); // (5+4+3)/3 = 4
    });

    it('should return 0 when no ratings exist', async () => {
      const userId = 'user-123';

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabaseAdmin.from.mockReturnValue(mockChain);

      const result = await userRepository.getUserAverageRating(userId);

      expect(result).toBe(0);
    });
  });
});