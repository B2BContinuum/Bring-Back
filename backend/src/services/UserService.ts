import { User } from '../models/User';
import { IUserRepository } from '../repositories/UserRepository';
import { VerificationStatus } from '../../../shared/src/types';
import { UserRating } from '../types/database.types';

export interface RatingSubmission {
  ratedUserId: string;
  raterUserId: string;
  rating: number;
  review?: string;
  deliveryRequestId?: string;
}

export interface IUserService {
  createUser(userData: Partial<User>): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null>;
  updateUserRating(id: string, newRating: number): Promise<User | null>;
  verifyUser(id: string, verificationType: VerificationStatus): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  getUserRatings(userId: string, limit?: number): Promise<UserRating[]>;
  submitRating(ratingData: RatingSubmission): Promise<UserRating>;
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async createUser(userData: Partial<User>): Promise<User> {
    // Validate user data
    const user = new User(userData);
    const validationResult = user.validate();
    
    if (!validationResult.isValid) {
      throw new Error(`Invalid user data: ${validationResult.errors.join(', ')}`);
    }
    
    // Convert User model to database format
    const userInsert = {
      email: user.email,
      name: user.name,
      phone: user.phone || null,
      profile_image: user.profileImage || null,
      address: user.address as any || null,
      rating: user.rating || 0,
      total_deliveries: user.totalDeliveries || 0,
      verification_status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Create user in database
    const createdUser = await this.userRepository.create(userInsert);
    
    // Convert database user to model
    return this.mapDbUserToModel(createdUser);
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      return null;
    }
    
    return this.mapDbUserToModel(user);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      return null;
    }
    
    return this.mapDbUserToModel(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    // Get current user
    const currentUser = await this.userRepository.findById(id);
    
    if (!currentUser) {
      return null;
    }
    
    // Convert model updates to database format
    const userUpdates: any = {};
    
    if (updates.name !== undefined) userUpdates.name = updates.name;
    if (updates.email !== undefined) userUpdates.email = updates.email;
    if (updates.phone !== undefined) userUpdates.phone = updates.phone;
    if (updates.profileImage !== undefined) userUpdates.profile_image = updates.profileImage;
    if (updates.address !== undefined) userUpdates.address = updates.address;
    
    userUpdates.updated_at = new Date().toISOString();
    
    // Update user in database
    const updatedUser = await this.userRepository.update(id, userUpdates);
    
    if (!updatedUser) {
      return null;
    }
    
    return this.mapDbUserToModel(updatedUser);
  }

  async updateUserRating(id: string, newRating: number): Promise<User | null> {
    // Get current user
    const currentUser = await this.userRepository.findById(id);
    
    if (!currentUser) {
      return null;
    }
    
    // Calculate new total deliveries
    const totalDeliveries = currentUser.total_deliveries + 1;
    
    // Update user rating in database
    const updatedUser = await this.userRepository.updateRating(id, newRating, totalDeliveries);
    
    if (!updatedUser) {
      return null;
    }
    
    return this.mapDbUserToModel(updatedUser);
  }

  async verifyUser(id: string, verificationType: VerificationStatus): Promise<User | null> {
    // Get current user
    const currentUser = await this.userRepository.findById(id);
    
    if (!currentUser) {
      return null;
    }
    
    // Update verification status
    const updatedUser = await this.userRepository.updateVerificationStatus(id, verificationType);
    
    if (!updatedUser) {
      return null;
    }
    
    return this.mapDbUserToModel(updatedUser);
  }

  async deleteUser(id: string): Promise<boolean> {
    return await this.userRepository.delete(id);
  }

  async getUserRatings(userId: string, limit: number = 10): Promise<UserRating[]> {
    return await this.userRepository.getUserRatings(userId, limit);
  }

  async submitRating(ratingData: RatingSubmission): Promise<UserRating> {
    // Validate rating
    if (ratingData.rating < 1 || ratingData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Check if rated user exists
    const ratedUser = await this.userRepository.findById(ratingData.ratedUserId);
    if (!ratedUser) {
      throw new Error('Rated user not found');
    }
    
    // Check if rater user exists
    const raterUser = await this.userRepository.findById(ratingData.raterUserId);
    if (!raterUser) {
      throw new Error('Rater user not found');
    }
    
    // Create rating in database
    const ratingInsert = {
      rated_user_id: ratingData.ratedUserId,
      rater_user_id: ratingData.raterUserId,
      rating: ratingData.rating,
      review: ratingData.review || null,
      delivery_request_id: ratingData.deliveryRequestId || null,
      created_at: new Date().toISOString()
    };
    
    const rating = await this.userRepository.addRating(ratingInsert);
    
    // Calculate new average rating
    const averageRating = await this.userRepository.getUserAverageRating(ratingData.ratedUserId);
    
    // Update user's average rating
    await this.updateUserRating(ratingData.ratedUserId, averageRating);
    
    return rating;
  }

  /**
   * Helper method to map database user to model
   */
  private mapDbUserToModel(dbUser: any): User {
    return new User({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      phone: dbUser.phone || '',
      profileImage: dbUser.profile_image,
      address: dbUser.address,
      rating: dbUser.rating,
      totalDeliveries: dbUser.total_deliveries,
      verificationStatus: this.mapDbVerificationStatus(dbUser.verification_status),
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at)
    });
  }

  /**
   * Map database verification status to model enum
   */
  private mapDbVerificationStatus(status: 'pending' | 'verified' | 'rejected'): VerificationStatus {
    switch (status) {
      case 'verified':
        return VerificationStatus.FULLY_VERIFIED;
      case 'rejected':
        return VerificationStatus.UNVERIFIED;
      default:
        return VerificationStatus.UNVERIFIED;
    }
  }
}