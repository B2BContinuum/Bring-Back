import { supabaseAdmin } from '../config/database';
import { 
  PaymentMethod, 
  PaymentMethodInsert, 
  PaymentMethodUpdate 
} from '../types/database.types';

export interface IPaymentMethodRepository {
  create(paymentMethodData: PaymentMethodInsert): Promise<PaymentMethod>;
  findById(id: string): Promise<PaymentMethod | null>;
  findByUserId(userId: string): Promise<PaymentMethod[]>;
  findDefaultByUserId(userId: string): Promise<PaymentMethod | null>;
  findByPaymentMethodId(paymentMethodId: string): Promise<PaymentMethod | null>;
  setDefault(id: string, userId: string): Promise<PaymentMethod | null>;
  update(id: string, updates: PaymentMethodUpdate): Promise<PaymentMethod | null>;
  delete(id: string): Promise<boolean>;
}

export class PaymentMethodRepository implements IPaymentMethodRepository {
  /**
   * Create a new payment method record
   */
  async create(paymentMethodData: PaymentMethodInsert): Promise<PaymentMethod> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .insert(paymentMethodData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payment method: ${error.message}`);
    }

    return data;
  }

  /**
   * Find payment method by ID
   */
  async findById(id: string): Promise<PaymentMethod | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find payment method by ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find payment methods by user ID
   */
  async findByUserId(userId: string): Promise<PaymentMethod[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find payment methods by user ID: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find default payment method for a user
   */
  async findDefaultByUserId(userId: string): Promise<PaymentMethod | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find default payment method: ${error.message}`);
    }

    return data;
  }

  /**
   * Find payment method by Stripe payment method ID
   */
  async findByPaymentMethodId(paymentMethodId: string): Promise<PaymentMethod | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('payment_method_id', paymentMethodId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find payment method by payment method ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Set a payment method as default for a user
   */
  async setDefault(id: string, userId: string): Promise<PaymentMethod | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // First, unset default for all user's payment methods
    const { error: updateError } = await supabaseAdmin
      .from('payment_methods')
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update payment methods: ${updateError.message}`);
    }

    // Then set the specified payment method as default
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId) // Ensure the payment method belongs to the user
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to set payment method as default: ${error.message}`);
    }

    return data;
  }

  /**
   * Update payment method information
   */
  async update(id: string, updates: PaymentMethodUpdate): Promise<PaymentMethod | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update payment method: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete payment method
   */
  async delete(id: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('payment_methods')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete payment method: ${error.message}`);
    }

    return true;
  }
}