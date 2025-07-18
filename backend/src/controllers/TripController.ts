import { Request, Response } from 'express';
import { ITripService } from '../services/TripService';
import { Trip, TripStatus } from '../../../shared/src/types';

export class TripController {
  constructor(private tripService: ITripService) {}

  /**
   * Create a new trip
   * POST /api/trips
   */
  async createTrip(req: Request, res: Response): Promise<void> {
    try {
      const tripData = req.body;
      
      // In a real app, userId would come from the authenticated user
      if (!tripData.userId) {
        res.status(401).json({
          success: false,
          error: 'User ID is required'
        });
        return;
      }

      // Convert string dates to Date objects
      if (tripData.departureTime) {
        tripData.departureTime = new Date(tripData.departureTime);
      }
      
      if (tripData.estimatedReturnTime) {
        tripData.estimatedReturnTime = new Date(tripData.estimatedReturnTime);
      }

      const trip = await this.tripService.createTrip(tripData);

      res.status(201).json({
        success: true,
        data: trip
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get trip by ID
   * GET /api/trips/:id
   */
  async getTripById(req: Request, res: Response): Promise<void> {
    try {
      const tripId = req.params.id;
      const trip = await this.tripService.getTripById(tripId);

      if (!trip) {
        res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: trip
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get trips by user ID
   * GET /api/trips/user/:userId
   */
  async getUserTrips(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const trips = await this.tripService.getUserTrips(userId);

      res.status(200).json({
        success: true,
        data: trips
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get nearby trips
   * GET /api/trips/nearby
   */
  async getNearbyTrips(req: Request, res: Response): Promise<void> {
    try {
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10; // Default 10km radius

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Valid latitude and longitude are required');
      }

      const trips = await this.tripService.getNearbyTrips(latitude, longitude, radius);

      res.status(200).json({
        success: true,
        data: trips
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update trip status
   * PUT /api/trips/:id/status
   */
  async updateTripStatus(req: Request, res: Response): Promise<void> {
    try {
      const tripId = req.params.id;
      const { status } = req.body;

      if (!status || !Object.values(TripStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Valid trip status is required'
        });
        return;
      }

      const trip = await this.tripService.updateTripStatus(tripId, status);

      if (!trip) {
        res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: trip
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update trip capacity
   * PUT /api/trips/:id/capacity
   */
  async updateTripCapacity(req: Request, res: Response): Promise<void> {
    try {
      const tripId = req.params.id;
      const { availableCapacity } = req.body;

      if (availableCapacity === undefined || isNaN(availableCapacity)) {
        res.status(400).json({
          success: false,
          error: 'Valid available capacity is required'
        });
        return;
      }

      const trip = await this.tripService.updateTripCapacity(tripId, availableCapacity);

      if (!trip) {
        res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: trip
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cancel trip
   * DELETE /api/trips/:id
   */
  async cancelTrip(req: Request, res: Response): Promise<void> {
    try {
      const tripId = req.params.id;
      const trip = await this.tripService.cancelTrip(tripId);

      if (!trip) {
        res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: trip
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get trip with details
   * GET /api/trips/:id/details
   */
  async getTripWithDetails(req: Request, res: Response): Promise<void> {
    try {
      const tripId = req.params.id;
      const trip = await this.tripService.getTripWithDetails(tripId);

      if (!trip) {
        res.status(404).json({
          success: false,
          error: 'Trip not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: trip
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}