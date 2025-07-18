import { Request, Response } from 'express';

export class TripController {
  /**
   * Create a new trip announcement
   * POST /api/trips
   */
  async createTrip(req: Request, res: Response): Promise<void> {
    // Implementation will be added in later tasks
    res.status(501).json({ error: 'Not implemented yet' });
  }

  /**
   * Get trips near user location
   * GET /api/trips/nearby
   */
  async getNearbyTrips(req: Request, res: Response): Promise<void> {
    // Implementation will be added in later tasks
    res.status(501).json({ error: 'Not implemented yet' });
  }

  /**
   * Update trip status
   * PUT /api/trips/:id/status
   */
  async updateTripStatus(req: Request, res: Response): Promise<void> {
    // Implementation will be added in later tasks
    res.status(501).json({ error: 'Not implemented yet' });
  }

  /**
   * Cancel trip
   * DELETE /api/trips/:id
   */
  async cancelTrip(req: Request, res: Response): Promise<void> {
    // Implementation will be added in later tasks
    res.status(501).json({ error: 'Not implemented yet' });
  }
}