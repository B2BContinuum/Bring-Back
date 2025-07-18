import { Pool } from 'pg';
import { DeviceToken } from '../models/DeviceToken';

export interface IDeviceTokenRepository {
  addDeviceToken(userId: string, deviceToken: string, deviceType: string): Promise<DeviceToken>;
  removeDeviceToken(userId: string, deviceToken: string): Promise<boolean>;
  getDeviceTokensByUserId(userId: string): Promise<DeviceToken[]>;
  getDeviceTokensByUserIds(userIds: string[]): Promise<Map<string, DeviceToken[]>>;
}

export class DeviceTokenRepository implements IDeviceTokenRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async addDeviceToken(userId: string, deviceToken: string, deviceType: string): Promise<DeviceToken> {
    const query = `
      INSERT INTO device_tokens (user_id, device_token, device_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, device_token) 
      DO UPDATE SET is_active = TRUE, device_type = $3, updated_at = NOW()
      RETURNING id, user_id, device_token, device_type, is_active, created_at, updated_at
    `;
    
    const result = await this.pool.query(query, [userId, deviceToken, deviceType]);
    return result.rows[0];
  }

  async removeDeviceToken(userId: string, deviceToken: string): Promise<boolean> {
    const query = `
      UPDATE device_tokens
      SET is_active = FALSE, updated_at = NOW()
      WHERE user_id = $1 AND device_token = $2
    `;
    
    const result = await this.pool.query(query, [userId, deviceToken]);
    return result.rowCount > 0;
  }

  async getDeviceTokensByUserId(userId: string): Promise<DeviceToken[]> {
    const query = `
      SELECT id, user_id, device_token, device_type, is_active, created_at, updated_at
      FROM device_tokens
      WHERE user_id = $1 AND is_active = TRUE
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async getDeviceTokensByUserIds(userIds: string[]): Promise<Map<string, DeviceToken[]>> {
    if (!userIds.length) {
      return new Map();
    }
    
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `
      SELECT id, user_id, device_token, device_type, is_active, created_at, updated_at
      FROM device_tokens
      WHERE user_id IN (${placeholders}) AND is_active = TRUE
    `;
    
    const result = await this.pool.query(query, userIds);
    
    const tokenMap = new Map<string, DeviceToken[]>();
    userIds.forEach(id => tokenMap.set(id, []));
    
    result.rows.forEach(row => {
      const tokens = tokenMap.get(row.user_id) || [];
      tokens.push(row);
      tokenMap.set(row.user_id, tokens);
    });
    
    return tokenMap;
  }
}