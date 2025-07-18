import { Request, Response } from 'express';
import { ILocationService } from '../services/LocationService';
import { LocationSearchParams } from '../../../shared/src/types';

export class LocationController {
  constructor(private locationService: ILocationService) {}

  /**
   * Search for locations based on query parameters
   * GET /api/locations/search
   */
  async searchLocations(req: Request, res: Response): Promise<void> {
    try {
      const searchParams: LocationSearchParams = {
        query: req.query.query as string,
        category: req.query.category as any,
        latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
        radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined
      };

      const locations = await this.locationService.searchLocations(searchParams);

      res.status(200).json({
        success: true,
        data: locations
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get nearby locations
   * GET /api/locations/nearby
   */
  async getNearbyLocations(req: Request, res: Response): Promise<void> {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 5; // Default 5km radius

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Valid latitude and longitude are required');
      }

      const locations = await this.locationService.getNearbyLocations(latitude, longitude, radius);

      res.status(200).json({
        success: true,
        data: locations
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get location by ID
   * GET /api/locations/:id
   */
  async getLocationById(req: Request, res: Response): Promise<void> {
    try {
      const locationId = req.params.id;
      const location = await this.locationService.getLocationById(locationId);

      if (!location) {
        res.status(404).json({
          success: false,
          error: 'Location not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: location
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user presence at a location
   * GET /api/locations/:id/presence
   */
  async getLocationPresence(req: Request, res: Response): Promise<void> {
    try {
      const locationId = req.params.id;
      const presence = await this.locationService.getLocationPresence(locationId);

      res.status(200).json({
        success: true,
        data: {
          locationId,
          userCount: presence.length,
          users: presence
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check in to a location
   * POST /api/locations/:id/checkin
   */
  async checkInToLocation(req: Request, res: Response): Promise<void> {
    try {
      const locationId = req.params.id;
      const userId = req.body.userId; // In a real app, this would come from the authenticated user

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const presence = await this.locationService.checkInUser(userId, locationId);

      res.status(200).json({
        success: true,
        data: presence
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check out from a location
   * POST /api/locations/:id/checkout
   */
  async checkOutFromLocation(req: Request, res: Response): Promise<void> {
    try {
      const locationId = req.params.id;
      const userId = req.body.userId; // In a real app, this would come from the authenticated user

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      const success = await this.locationService.checkOutUser(userId, locationId);

      res.status(200).json({
        success: true,
        data: { success }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}