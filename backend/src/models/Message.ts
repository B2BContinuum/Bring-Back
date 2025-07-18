export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  related_request_id?: string;
  related_trip_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Conversation {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: Date;
  conversation_id: string;
}

export interface MessageCreateParams {
  sender_id: string;
  recipient_id: string;
  content: string;
  related_request_id?: string;
  related_trip_id?: string;
}