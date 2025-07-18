import { supabaseAdmin } from '../config/database';
import { 
  Payment, 
  PaymentInsert, 
  PaymentUpdate, 
  PaymentStatus as DbPaymentStatus,
  PaymentType as DbPaymentType
} from '../types/database.types';
import { PaymentStatus, PaymentType } from '../models/Payment';

export interface IPaymentRepository {
  create(paymentData: PaymentInsert): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByRequestId(requestId: string): Promise<Payment[]>;
  findByPaymentIntentId(paymentIntentId: string): Promise<Payment | null>;
  findByCustomerId(customerId: string): Promise<Payment[]>;
  findByStatus(status: DbPaymentStatus): Promise<Payment[]>;
  updateStatus(id: string, status: PaymentStatus): Promise<Payment | null>;
  markAsCaptured(id: string, capturedAt?: Date): Promise<Payment | null>;
  markAsTransferred(id: string, transferredAt?: Date): Promise<Payment | null>;
  markAsRefunded(id: string, refundedAt?: Date): Promise<Payment | null>;
  markAsFailed(id: string, reason: string, failedAt?: Date): Promise<Payment | null>;
  update(id: string, updates: PaymentUpdate): Promise<Payment | null>;
  delete(id: string): Promise<boolean>;
}

export class PaymentRepository implements IPaymentRepository {
  /**
   * Create a new payment record
   */
  async create(paymentData: PaymentInsert): Promise<Payment> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payment record: ${error.message}`);
    }

    return data;
  }

  /**
   * Find payment by ID
   */
  async findById(id: string): Promise<Payment | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find payment by ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find payments by request ID
   */
  async findByRequestId(requestId: string): Promise<Payment[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find payments by request ID: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find payment by Stripe payment intent ID
   */
  async findByPaymentIntentId(paymentIntentId: string): Promise<Payment | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      throw new Error(`Failed to find payment by payment intent ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find payments by customer ID
   */
  async findByCustomerId(customerId: string): Promise<Payment[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find payments by customer ID: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: DbPaymentStatus): Promise<Payment[]> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find payments by status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update payment status
   */
  async updateStatus(id: string, status: PaymentStatus): Promise<Payment | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    // Map shared enum to database enum
    const dbStatus = this.mapPaymentStatusToDb(status);

    const updateData: any = {
      status: dbStatus,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update payment status: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark payment as captured
   */
  async markAsCaptured(id: string, capturedAt?: Date): Promise<Payment | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'captured',
        captured_at: (capturedAt || new Date()).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to mark payment as captured: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark payment as transferred
   */
  async markAsTransferred(id: string, transferredAt?: Date): Promise<Payment | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'transferred',
        transferred_at: (transferredAt || new Date()).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to mark payment as transferred: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark payment as refunded
   */
  async markAsRefunded(id: string, refundedAt?: Date): Promise<Payment | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: (refundedAt || new Date()).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to mark payment as refunded: ${error.message}`);
    }

    return data;
  }

  /**
   * Mark payment as failed
   */
  async markAsFailed(id: string, reason: string, failedAt?: Date): Promise<Payment | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({
        status: 'failed',
        failed_at: (failedAt || new Date()).toISOString(),
        failure_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to mark payment as failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Update payment information
   */
  async update(id: string, updates: PaymentUpdate): Promise<Payment | null> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows updated
      }
      throw new Error(`Failed to update payment: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete payment record
   */
  async delete(id: string): Promise<boolean> {
    if (!supabaseAdmin) {
      throw new Error('Database connection not available');
    }

    const { error } = await supabaseAdmin
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete payment: ${error.message}`);
    }

    return true;
  }

  /**
   * Map shared PaymentStatus enum to database enum
   */
  private mapPaymentStatusToDb(status: PaymentStatus): DbPaymentStatus {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'pending';
      case PaymentStatus.AUTHORIZED:
        return 'authorized';
      case PaymentStatus.CAPTURED:
        return 'captured';
      case PaymentStatus.TRANSFERRED:
        return 'transferred';
      case PaymentStatus.REFUNDED:
        return 'refunded';
      case PaymentStatus.FAILED:
        return 'failed';
      case PaymentStatus.CANCELLED:
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Map shared PaymentType enum to database enum
   */
  private mapPaymentTypeToDb(type: PaymentType): DbPaymentType {
    switch (type) {
      case PaymentType.DELIVERY_PAYMENT:
        return 'delivery_payment';
      case PaymentType.REFUND:
        return 'refund';
      case PaymentType.PAYOUT:
        return 'payout';
      default:
        return 'delivery_payment';
    }
  }
}