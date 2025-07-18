import { Pool } from 'pg';
import { StatusUpdate } from '../services/StatusTrackingService';
import { v4 as uuidv4 } from 'uuid';

export interface StatusUpdateInsert {
  entity_type: 'trip' | 'request';
  entity_id: string;
  status: string;
  timestamp: string;
  photo_url?: string;
  receipt_url?: string;
  metadata?: Record<string, any>;
}

export interface StatusAttachmentInsert {
  status_update_id: string;
  attachment_type: 'photo' | 'receipt';
  url: string;
  metadata?: Record<string, any>;
}

export interface IStatusTrackingRepository {
  createStatusUpdate(data: StatusUpdateInsert): Promise<StatusUpdate>;
  getStatusHistory(entityType: 'trip' | 'request', entityId: string, limit?: number, offset?: number): Promise<StatusUpdate[]>;
  getLatestStatus(entityType: 'trip' | 'request', entityId: string): Promise<StatusUpdate | null>;
  addAttachment(data: StatusAttachmentInsert): Promise<{ id: string; url: string }>;
  getAttachments(statusUpdateId: string): Promise<{ id: string; type: string; url: string; metadata?: any }[]>;
}

export class StatusTrackingRepository implements IStatusTrackingRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new status update
   */
  async createStatusUpdate(data: StatusUpdateInsert): Promise<StatusUpdate> {
    const id = `st_${uuidv4().replace(/-/g, '')}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO status_updates (
        id, entity_type, entity_id, status, timestamp, 
        photo_url, receipt_url, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      id,
      data.entity_type,
      data.entity_id,
      data.status,
      data.timestamp,
      data.photo_url || null,
      data.receipt_url || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now,
      now
    ];

    const result = await this.pool.query(query, values);
    const row = result.rows[0];

    return this.mapRowToStatusUpdate(row);
  }

  /**
   * Get status history for an entity
   */
  async getStatusHistory(
    entityType: 'trip' | 'request',
    entityId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<StatusUpdate[]> {
    const query = `
      SELECT * FROM status_updates
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY timestamp DESC
      LIMIT $3 OFFSET $4
    `;

    const values = [entityType, entityId, limit, offset];
    const result = await this.pool.query(query, values);

    return result.rows.map(row => this.mapRowToStatusUpdate(row));
  }

  /**
   * Get latest status for an entity
   */
  async getLatestStatus(entityType: 'trip' | 'request', entityId: string): Promise<StatusUpdate | null> {
    const query = `
      SELECT * FROM status_updates
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const values = [entityType, entityId];
    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToStatusUpdate(result.rows[0]);
  }

  /**
   * Add an attachment to a status update
   */
  async addAttachment(data: StatusAttachmentInsert): Promise<{ id: string; url: string }> {
    const id = `sa_${uuidv4().replace(/-/g, '')}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO status_attachments (
        id, status_update_id, attachment_type, url, metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, url
    `;

    const values = [
      id,
      data.status_update_id,
      data.attachment_type,
      data.url,
      data.metadata ? JSON.stringify(data.metadata) : null,
      now,
      now
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get attachments for a status update
   */
  async getAttachments(statusUpdateId: string): Promise<{ id: string; type: string; url: string; metadata?: any }[]> {
    const query = `
      SELECT id, attachment_type as type, url, metadata
      FROM status_attachments
      WHERE status_update_id = $1
      ORDER BY created_at ASC
    `;

    const values = [statusUpdateId];
    const result = await this.pool.query(query, values);

    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      url: row.url,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  /**
   * Map database row to StatusUpdate object
   */
  private mapRowToStatusUpdate(row: any): StatusUpdate {
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      status: row.status,
      timestamp: new Date(row.timestamp),
      photoUrl: row.photo_url || undefined,
      receiptUrl: row.receipt_url || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    };
  }
}