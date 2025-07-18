export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          profile_image: string | null
          address: Json | null
          rating: number
          total_deliveries: number
          verification_status: 'pending' | 'verified' | 'rejected'
          stripe_customer_id: string | null
          stripe_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone?: string | null
          profile_image?: string | null
          address?: Json | null
          rating?: number
          total_deliveries?: number
          verification_status?: 'pending' | 'verified' | 'rejected'
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          profile_image?: string | null
          address?: Json | null
          rating?: number
          total_deliveries?: number
          verification_status?: 'pending' | 'verified' | 'rejected'
          stripe_customer_id?: string | null
          stripe_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          is_read: boolean
          related_request_id: string | null
          related_trip_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          is_read?: boolean
          related_request_id?: string | null
          related_trip_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          is_read?: boolean
          related_request_id?: string | null
          related_trip_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: Json
          coordinates: string // PostGIS POINT type
          category: 'grocery' | 'pharmacy' | 'restaurant' | 'retail' | 'other'
          verified: boolean
          current_user_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: Json
          coordinates: string
          category: 'grocery' | 'pharmacy' | 'restaurant' | 'retail' | 'other'
          verified?: boolean
          current_user_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: Json
          coordinates?: string
          category?: 'grocery' | 'pharmacy' | 'restaurant' | 'retail' | 'other'
          verified?: boolean
          current_user_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      location_presence: {
        Row: {
          id: string
          user_id: string
          location_id: string
          checked_in_at: string
          checked_out_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          location_id: string
          checked_in_at?: string
          checked_out_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          location_id?: string
          checked_in_at?: string
          checked_out_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          destination_id: string
          departure_time: string
          estimated_return_time: string | null
          capacity: number
          available_capacity: number
          status: 'announced' | 'in_progress' | 'at_destination' | 'returning' | 'completed' | 'cancelled'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          destination_id: string
          departure_time: string
          estimated_return_time?: string | null
          capacity?: number
          available_capacity?: number
          status?: 'announced' | 'in_progress' | 'at_destination' | 'returning' | 'completed' | 'cancelled'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          destination_id?: string
          departure_time?: string
          estimated_return_time?: string | null
          capacity?: number
          available_capacity?: number
          status?: 'announced' | 'in_progress' | 'at_destination' | 'returning' | 'completed' | 'cancelled'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      delivery_requests: {
        Row: {
          id: string
          trip_id: string
          requester_id: string
          items: Json
          delivery_address: Json
          max_item_budget: number
          delivery_fee: number
          special_instructions: string | null
          status: 'pending' | 'accepted' | 'purchased' | 'in_transit' | 'delivered' | 'cancelled'
          created_at: string
          accepted_at: string | null
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          requester_id: string
          items: Json
          delivery_address: Json
          max_item_budget: number
          delivery_fee: number
          special_instructions?: string | null
          status?: 'pending' | 'accepted' | 'purchased' | 'in_transit' | 'delivered' | 'cancelled'
          created_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          requester_id?: string
          items?: Json
          delivery_address?: Json
          max_item_budget?: number
          delivery_fee?: number
          special_instructions?: string | null
          status?: 'pending' | 'accepted' | 'purchased' | 'in_transit' | 'delivered' | 'cancelled'
          created_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          request_id: string
          payment_intent_id: string
          customer_id: string
          amount: number
          currency: string
          status: 'pending' | 'authorized' | 'captured' | 'transferred' | 'refunded' | 'failed' | 'cancelled'
          type: 'delivery_payment' | 'refund' | 'payout'
          description: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
          captured_at: string | null
          transferred_at: string | null
          refunded_at: string | null
          failed_at: string | null
          failure_reason: string | null
        }
        Insert: {
          id?: string
          request_id: string
          payment_intent_id: string
          customer_id: string
          amount: number
          currency: string
          status?: 'pending' | 'authorized' | 'captured' | 'transferred' | 'refunded' | 'failed' | 'cancelled'
          type?: 'delivery_payment' | 'refund' | 'payout'
          description?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          captured_at?: string | null
          transferred_at?: string | null
          refunded_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
        }
        Update: {
          id?: string
          request_id?: string
          payment_intent_id?: string
          customer_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'authorized' | 'captured' | 'transferred' | 'refunded' | 'failed' | 'cancelled'
          type?: 'delivery_payment' | 'refund' | 'payout'
          description?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
          captured_at?: string | null
          transferred_at?: string | null
          refunded_at?: string | null
          failed_at?: string | null
          failure_reason?: string | null
        }
      }
      payment_methods: {
        Row: {
          id: string
          user_id: string
          payment_method_id: string
          type: string
          last_four: string
          brand: string
          exp_month: number
          exp_year: number
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_method_id: string
          type: string
          last_four: string
          brand: string
          exp_month: number
          exp_year: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_method_id?: string
          type?: string
          last_four?: string
          brand?: string
          exp_month?: number
          exp_year?: number
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_ratings: {
        Row: {
          id: string
          rated_user_id: string
          rater_user_id: string
          delivery_request_id: string | null
          rating: number
          review: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rated_user_id: string
          rater_user_id: string
          delivery_request_id?: string | null
          rating: number
          review?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rated_user_id?: string
          rater_user_id?: string
          delivery_request_id?: string | null
          rating?: number
          review?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      verification_status: 'pending' | 'verified' | 'rejected'
      trip_status: 'announced' | 'in_progress' | 'at_destination' | 'returning' | 'completed' | 'cancelled'
      request_status: 'pending' | 'accepted' | 'purchased' | 'in_transit' | 'delivered' | 'cancelled'
      location_category: 'grocery' | 'pharmacy' | 'restaurant' | 'retail' | 'other'
      payment_status: 'pending' | 'authorized' | 'captured' | 'transferred' | 'refunded' | 'failed' | 'cancelled'
      payment_type: 'delivery_payment' | 'refund' | 'payout'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type User = Tables<'users'>
export type UserInsert = TablesInsert<'users'>
export type UserUpdate = TablesUpdate<'users'>

export type Location = Tables<'locations'>
export type LocationInsert = TablesInsert<'locations'>
export type LocationUpdate = TablesUpdate<'locations'>

export type LocationPresence = Tables<'location_presence'>
export type LocationPresenceInsert = TablesInsert<'location_presence'>
export type LocationPresenceUpdate = TablesUpdate<'location_presence'>

export type Trip = Tables<'trips'>
export type TripInsert = TablesInsert<'trips'>
export type TripUpdate = TablesUpdate<'trips'>

export type DeliveryRequest = Tables<'delivery_requests'>
export type DeliveryRequestInsert = TablesInsert<'delivery_requests'>
export type DeliveryRequestUpdate = TablesUpdate<'delivery_requests'>

export type Payment = Tables<'payments'>
export type PaymentInsert = TablesInsert<'payments'>
export type PaymentUpdate = TablesUpdate<'payments'>

export type PaymentMethod = Tables<'payment_methods'>
export type PaymentMethodInsert = TablesInsert<'payment_methods'>
export type PaymentMethodUpdate = TablesUpdate<'payment_methods'>

export type UserRating = Tables<'user_ratings'>
export type UserRatingInsert = TablesInsert<'user_ratings'>
export type UserRatingUpdate = TablesUpdate<'user_ratings'>

export type Message = Tables<'messages'>
export type MessageInsert = TablesInsert<'messages'>
export type MessageUpdate = TablesUpdate<'messages'>

// Enum types
export type VerificationStatus = Database['public']['Enums']['verification_status']
export type TripStatus = Database['public']['Enums']['trip_status']
export type RequestStatus = Database['public']['Enums']['request_status']
export type LocationCategory = Database['public']['Enums']['location_category']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PaymentType = Database['public']['Enums']['payment_type']