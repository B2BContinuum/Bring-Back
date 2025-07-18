import { Pool } from 'pg';
import { Message, Conversation, MessageCreateParams } from '../models/Message';

export interface IMessageRepository {
  createMessage(message: MessageCreateParams): Promise<Message>;
  getMessageById(id: string): Promise<Message | null>;
  getMessagesByConversation(userId1: string, userId2: string, limit?: number, offset?: number): Promise<Message[]>;
  getConversations(userId: string, limit?: number, offset?: number): Promise<Conversation[]>;
  markMessageAsRead(messageId: string): Promise<boolean>;
  markAllMessagesAsRead(recipientId: string, senderId: string): Promise<number>;
  getUnreadMessageCount(userId: string): Promise<number>;
}

export class MessageRepository implements IMessageRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createMessage(message: MessageCreateParams): Promise<Message> {
    const query = `
      INSERT INTO messages (sender_id, recipient_id, content, related_request_id, related_trip_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, sender_id, recipient_id, content, is_read, related_request_id, related_trip_id, created_at, updated_at
    `;
    
    const result = await this.pool.query(query, [
      message.sender_id,
      message.recipient_id,
      message.content,
      message.related_request_id || null,
      message.related_trip_id || null
    ]);
    
    return result.rows[0];
  }

  async getMessageById(id: string): Promise<Message | null> {
    const query = `
      SELECT id, sender_id, recipient_id, content, is_read, related_request_id, related_trip_id, created_at, updated_at
      FROM messages
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async getMessagesByConversation(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const query = `
      SELECT id, sender_id, recipient_id, content, is_read, related_request_id, related_trip_id, created_at, updated_at
      FROM messages
      WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const result = await this.pool.query(query, [userId1, userId2, limit, offset]);
    return result.rows;
  }

  async getConversations(userId: string, limit: number = 20, offset: number = 0): Promise<Conversation[]> {
    const query = `
      WITH latest_messages AS (
        SELECT 
          DISTINCT ON (
            CASE WHEN sender_id < recipient_id 
              THEN sender_id || '-' || recipient_id 
              ELSE recipient_id || '-' || sender_id 
            END
          ) 
          id,
          sender_id,
          recipient_id,
          content,
          is_read,
          created_at,
          CASE WHEN sender_id < recipient_id 
            THEN sender_id || '-' || recipient_id 
            ELSE recipient_id || '-' || sender_id 
          END as conversation_id
        FROM messages
        WHERE sender_id = $1 OR recipient_id = $1
        ORDER BY conversation_id, created_at DESC
      )
      SELECT * FROM latest_messages
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    const query = `
      UPDATE messages
      SET is_read = TRUE, updated_at = NOW()
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [messageId]);
    return result.rowCount > 0;
  }

  async markAllMessagesAsRead(recipientId: string, senderId: string): Promise<number> {
    const query = `
      UPDATE messages
      SET is_read = TRUE, updated_at = NOW()
      WHERE recipient_id = $1 AND sender_id = $2 AND is_read = FALSE
    `;
    
    const result = await this.pool.query(query, [recipientId, senderId]);
    return result.rowCount;
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE recipient_id = $1 AND is_read = FALSE
    `;
    
    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }
}