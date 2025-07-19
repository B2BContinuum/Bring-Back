import { supabaseAdmin } from '../config/database';
import { User, UserInsert, UserUpdate, UserRating, UserRatingInsert } from '../types/database.types';
import { VerificationStatus } from '../../../shared/src/types';

export interface IUserRepository {
  create(userData: UserInsert): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  update(id: string, updates: UserUpdate): Promise<User | null>;
  updateRating(id: string, rating: number, totalDeliveries: number): Promise<User | null>;
  updateVerificationStatus(id: string, status: VerificationStatus): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  addRating(ratingData: UserRatingInsert): Promise<UserRating>;
  getUserRatings(userId: string, limit?: number): Promise<UserRating[]>;
  getUserAverageRating(userId: string): Promise<number>;
  mapDbUserToModel(dbUser: any): User;
}

export class UserRepository implements IUserRepository {
  /**
   * Create a new user
   */
  async create(userData: UserInsert): Promise<User> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phone: string): Promise<User | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find user by phone: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user information
   */
  async update(id: string, updates: UserUpdate): Promise<User | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user rating and total deliveries
   */
  async updateRating(id: string, rating: number, totalDeliveries: number): Promise<User | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        rating,
        total_deliveries: totalDeliveries,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update user rating: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user verification status
   */
  async updateVerificationStatus(id: string, status: VerificationStatus): Promise<User | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Map shared enum to database enum
    const dbStatus = this.mapVerificationStatusToDb(status);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        verification_status: dbStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update verification status: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete user (soft delete by updating status)
   */
  async delete(id: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return true;
  }

  /**
   * Add a rating for a user
   */
  async addRating(ratingData: UserRatingInsert): Promise<UserRating> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('user_ratings')
      .insert(ratingData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add rating: ${error.message}`);
    }

    return data;
  }

  /**
   * Get ratings for a user
   */
  async getUserRatings(userId: string, limit: number = 10): Promise<UserRating[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('user_ratings')
      .select('*')
      .eq('rated_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get user ratings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Calculate and return user's average rating
   */
  async getUserAverageRating(userId: string): Promise<number> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('user_ratings')
      .select('rating')
      .eq('rated_user_id', userId);

    if (error) {
      throw new Error(`Failed to calculate average rating: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return 0;
    }

    const sum = data.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.round((sum / data.length) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Map shared VerificationStatus enum to database enum
   */
  private mapVerificationStatusToDb(status: VerificationStatus): 'pending' | 'verified' | 'rejected' {
    switch (status) {
      case VerificationStatus.UNVERIFIED:
        return 'pending';
      case VerificationStatus.EMAIL_VERIFIED:
      case VerificationStatus.PHONE_VERIFIED:
      case VerificationStatus.FULLY_VERIFIED:
        return 'verified';
      default:
        return 'pending';
    }
  }

  /**
   * Map database user to model
   */
  mapDbUserToModel(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      phone: dbUser.phone || '',
      profileImage: dbUser.profile_image,
      address: dbUser.address,
      rating: dbUser.rating,
      totalDeliveries: dbUser.total_deliveries,
      verificationStatus: this.mapDbVerificationStatusToModel(dbUser.verification_status),
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at)
    };
  }

  /**
   * Map database verification status to model enum
   */
  private mapDbVerificationStatusToModel(status: 'pending' | 'verified' | 'rejected'): VerificationStatus {
    // Determine verification status based on email_verified and phone_verified flags
    if (status === 'verified') {
      return VerificationStatus.FULLY_VERIFIED;
    } else {
      return VerificationStatus.UNVERIFIED;
    }
  }
}