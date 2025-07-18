import { StatusTrackingRepository } from '../StatusTrackingRepository';
import { Pool } from 'pg';

// Mock pg Pool
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn()
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe('StatusTrackingRepository', () => {
  let statusTrackingRepository: StatusTrackingRepository;
  let mockPool: any;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get mock pool instance
    mockPool = new Pool() as any;
    
    // Create repository instance with mocked pool
    statusTrackingRepository = new StatusTrackingRepository(mockPool);
  });
  
  describe('createStatusUpdate', () => {
    it('should create a status update successfully', async () => {
      // Setup mock response
      const mockRow = {
        id: 'st_123',
        entity_type: 'trip',
        entity_id: 'trip-123',
        status: 'traveling',
        timestamp: '2025-01-01T10:00:00Z',
        photo_url: null,
        receipt_url: null,
        metadata: '{"key":"value"}',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z'
      };
      
      mockPool.query.mockResolvedValue({
        rows: [mockRow]
      });
      
      // Call the method
      const result = await statusTrackingRepository.createStatusUpdate({
        entity_type: 'trip',
        entity_id: 'trip-123',
        status: 'traveling',
        timestamp: '2025-01-01T10:00:00Z',
        metadata: { key: 'value' }
      });
      
      // Verify query was called with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO status_updates'),
        expect.arrayContaining(['trip', 'trip-123', 'traveling'])
      );
      
      // Verify returned object
      expect(result).toMatchObject({
        entityType: 'trip',
        entityId: 'trip-123',
        status: 'traveling',
        metadata: { key: 'value' }
      });
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });
  
  describe('getStatusHistory', () => {
    it('should get status history successfully', async () => {
      // Setup mock response
      const mockRows = [
        {
          id: 'st_123',
          entity_type: 'trip',
          entity_id: 'trip-123',
          status: 'announced',
          timestamp: '2025-01-01T09:00:00Z',
          photo_url: null,
          receipt_url: null,
          metadata: null
        },
        {
          id: 'st_124',
          entity_type: 'trip',
          entity_id: 'trip-123',
          status: 'traveling',
          timestamp: '2025-01-01T10:00:00Z',
          photo_url: null,
          receipt_url: null,
          metadata: null
        }
      ];
      
      mockPool.query.mockResolvedValue({
        rows: mockRows
      });
      
      // Call the method
      const result = await statusTrackingRepository.getStatusHistory('trip', 'trip-123', 10, 0);
      
      // Verify query was called with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM status_updates'),
        ['trip', 'trip-123', 10, 0]
      );
      
      // Verify returned array
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'st_123',
        entityType: 'trip',
        entityId: 'trip-123',
        status: 'announced'
      });
      expect(result[1]).toMatchObject({
        id: 'st_124',
        entityType: 'trip',
        entityId: 'trip-123',
        status: 'traveling'
      });
    });
    
    it('should return empty array if no history found', async () => {
      // Setup mock response
      mockPool.query.mockResolvedValue({
        rows: []
      });
      
      // Call the method
      const result = await statusTrackingRepository.getStatusHistory('trip', 'non-existent-trip');
      
      // Verify returned array
      expect(result).toEqual([]);
    });
  });
  
  describe('getLatestStatus', () => {
    it('should get latest status successfully', async () => {
      // Setup mock response
      const mockRow = {
        id: 'st_124',
        entity_type: 'trip',
        entity_id: 'trip-123',
        status: 'traveling',
        timestamp: '2025-01-01T10:00:00Z',
        photo_url: null,
        receipt_url: null,
        metadata: null
      };
      
      mockPool.query.mockResolvedValue({
        rows: [mockRow]
      });
      
      // Call the method
      const result = await statusTrackingRepository.getLatestStatus('trip', 'trip-123');
      
      // Verify query was called with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM status_updates'),
        ['trip', 'trip-123']
      );
      
      // Verify returned object
      expect(result).toMatchObject({
        id: 'st_124',
        entityType: 'trip',
        entityId: 'trip-123',
        status: 'traveling'
      });
    });
    
    it('should return null if no status found', async () => {
      // Setup mock response
      mockPool.query.mockResolvedValue({
        rows: []
      });
      
      // Call the method
      const result = await statusTrackingRepository.getLatestStatus('trip', 'non-existent-trip');
      
      // Verify returned value
      expect(result).toBeNull();
    });
  });
  
  describe('addAttachment', () => {
    it('should add attachment successfully', async () => {
      // Setup mock response
      mockPool.query.mockResolvedValue({
        rows: [{ id: 'sa_123', url: 'https://example.com/photo.jpg' }]
      });
      
      // Call the method
      const result = await statusTrackingRepository.addAttachment({
        status_update_id: 'st_123',
        attachment_type: 'photo',
        url: 'https://example.com/photo.jpg',
        metadata: { width: 800, height: 600 }
      });
      
      // Verify query was called with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO status_attachments'),
        expect.arrayContaining(['st_123', 'photo', 'https://example.com/photo.jpg'])
      );
      
      // Verify returned object
      expect(result).toEqual({
        id: 'sa_123',
        url: 'https://example.com/photo.jpg'
      });
    });
  });
  
  describe('getAttachments', () => {
    it('should get attachments successfully', async () => {
      // Setup mock response
      const mockRows = [
        {
          id: 'sa_123',
          type: 'photo',
          url: 'https://example.com/photo1.jpg',
          metadata: '{"width":800,"height":600}'
        },
        {
          id: 'sa_124',
          type: 'photo',
          url: 'https://example.com/photo2.jpg',
          metadata: null
        }
      ];
      
      mockPool.query.mockResolvedValue({
        rows: mockRows
      });
      
      // Call the method
      const result = await statusTrackingRepository.getAttachments('st_123');
      
      // Verify query was called with correct parameters
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, attachment_type as type, url, metadata'),
        ['st_123']
      );
      
      // Verify returned array
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'sa_123',
        type: 'photo',
        url: 'https://example.com/photo1.jpg',
        metadata: { width: 800, height: 600 }
      });
      expect(result[1]).toEqual({
        id: 'sa_124',
        type: 'photo',
        url: 'https://example.com/photo2.jpg'
      });
    });
    
    it('should return empty array if no attachments found', async () => {
      // Setup mock response
      mockPool.query.mockResolvedValue({
        rows: []
      });
      
      // Call the method
      const result = await statusTrackingRepository.getAttachments('st_123');
      
      // Verify returned array
      expect(result).toEqual([]);
    });
  });
});