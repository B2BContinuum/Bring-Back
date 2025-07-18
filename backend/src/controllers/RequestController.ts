import { Request, Response } from 'express';

export class RequestController {
  /**
   * Create delivery request
   * POST /api/requests
   */
  async createRequest(req: Request, res: Response): Promise<void> {
    // Implementation will be added in later tasks
    res.status(501).json({ error: 'Not implemented yet' });
  }

  /**
   * Get requests for specific trip
   * GET /api/requests/for-trip/:tripId
   */
  async getRequestsForTrip(req: Request, res: Response): Promise<void> {
    // Implementation will be added in later tasks
    res.status(501).json({ error: 'Not implemented yet' });
  }

  /**
   * Accept delivery request
   * PUT /api/requests/:id/accept
   */
  async acceptRequest(req: Request, res: Response): Promise<void> {
    // Implementation will be added in later tasks
    res.status(501).json({ error: 'Not implemented yet' });
  }

  /**
   * Update request status
   * PUT /api/requests/:id/status
   */
  async updateRequestStatus(req: Request, res: Response): Promise<void> {
    // Implementation will be added in later tasks
    res.status(501).json({ error: 'Not implemented yet' });
  }
}