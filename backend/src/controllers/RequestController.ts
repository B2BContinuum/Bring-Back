import { Request, Response } from 'express';
import { IRequestService } from '../services/RequestService';
import { IPaymentService } from '../services/PaymentService';
import { PaymentProvider } from '../interfaces/PaymentProvider';
import { RequestStatus } from '../../../shared/src/types';

export class RequestController {
  constructor(
    private requestService: IRequestService,
    private paymentService: IPaymentService,
    private paymentProvider: PaymentProvider
  ) {}

  /**
   * Create a new delivery request
   * POST /api/requests
   */
  async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      
      // In a real app, requesterId would come from the authenticated user
      if (!requestData.requesterId) {
        res.status(401).json({
          success: false,
          error: 'Requester ID is required'
        });
        return;
      }

      // Create the delivery request
      const deliveryRequest = await this.requestService.createRequest(requestData);

      // Calculate total cost
      const { total } = await this.paymentService.calculateTotalCost(
        deliveryRequest.id,
        requestData.tip || 0
      );

      // Get or create customer
      const user = await this.paymentService.getOrCreateCustomer(
        deliveryRequest.requesterId,
        requestData.email || 'user@example.com', // In a real app, this would come from the user's profile
        requestData.name || 'User' // In a real app, this would come from the user's profile
      );

      // Create payment intent
      const { clientSecret } = await this.paymentService.createPaymentIntent(
        deliveryRequest.id,
        total,
        user,
        `Payment for delivery request ${deliveryRequest.id}`
      );

      res.status(201).json({
        success: true,
        data: {
          request: deliveryRequest,
          payment: {
            clientSecret,
            amount: total
          }
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
   * Get request by ID
   * GET /api/requests/:id
   */
  async getRequestById(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.id;
      const deliveryRequest = await this.requestService.getRequestById(requestId);

      if (!deliveryRequest) {
        res.status(404).json({
          success: false,
          error: 'Delivery request not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: deliveryRequest
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get requests by trip ID
   * GET /api/requests/for-trip/:tripId
   */
  async getRequestsByTripId(req: Request, res: Response): Promise<void> {
    try {
      const tripId = req.params.tripId;
      const requests = await this.requestService.getRequestsByTripId(tripId);

      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get requests by requester ID
   * GET /api/requests/by-requester/:requesterId
   */
  async getRequestsByRequesterId(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.params.requesterId;
      const requests = await this.requestService.getRequestsByRequesterId(requesterId);

      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Accept a delivery request
   * PUT /api/requests/:id/accept
   */
  async acceptRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.id;
      const acceptedAt = req.body.acceptedAt ? new Date(req.body.acceptedAt) : undefined;

      const deliveryRequest = await this.requestService.acceptRequest(requestId, acceptedAt);

      if (!deliveryRequest) {
        res.status(404).json({
          success: false,
          error: 'Delivery request not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: deliveryRequest
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update request status
   * PUT /api/requests/:id/status
   */
  async updateRequestStatus(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.id;
      const { status } = req.body;

      if (!status || !Object.values(RequestStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Valid request status is required'
        });
        return;
      }

      const deliveryRequest = await this.requestService.updateRequestStatus(requestId, status);

      if (!deliveryRequest) {
        res.status(404).json({
          success: false,
          error: 'Delivery request not found'
        });
        return;
      }

      // If status is PURCHASED, capture the payment
      if (status === RequestStatus.PURCHASED) {
        // Find the payment for this request
        const payments = await this.paymentService.getPaymentsByRequestId(requestId);
        if (payments.length > 0) {
          // Capture the payment
          await this.paymentService.capturePayment(payments[0].id);
        }
      }

      res.status(200).json({
        success: true,
        data: deliveryRequest
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Complete a delivery request
   * PUT /api/requests/:id/complete
   */
  async completeRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.id;
      const completedAt = req.body.completedAt ? new Date(req.body.completedAt) : undefined;

      const deliveryRequest = await this.requestService.completeRequest(requestId, completedAt);

      if (!deliveryRequest) {
        res.status(404).json({
          success: false,
          error: 'Delivery request not found'
        });
        return;
      }

      // Transfer funds to traveler
      // In a real app, we would get the traveler ID from the trip associated with the request
      const travelerId = 'traveler-123'; // Placeholder
      const payments = await this.paymentService.getPaymentsByRequestId(requestId);
      if (payments.length > 0) {
        await this.paymentService.transferToTraveler(payments[0].id, travelerId);
      }

      res.status(200).json({
        success: true,
        data: deliveryRequest
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cancel a delivery request
   * DELETE /api/requests/:id
   */
  async cancelRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.id;
      const success = await this.requestService.cancelRequest(requestId);

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Delivery request not found'
        });
        return;
      }

      // Refund any payments
      const payments = await this.paymentService.getPaymentsByRequestId(requestId);
      if (payments.length > 0) {
        await this.paymentService.refundPayment(payments[0].id, undefined, 'Request cancelled');
      }

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

  /**
   * Match requests to a trip
   * GET /api/requests/match/:tripId
   */
  async matchRequestsToTrip(req: Request, res: Response): Promise<void> {
    try {
      const tripId = req.params.tripId;
      const maxResults = req.query.maxResults ? parseInt(req.query.maxResults as string) : undefined;

      const requests = await this.requestService.matchRequestsToTrip(tripId, maxResults);

      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get request with details
   * GET /api/requests/:id/details
   */
  async getRequestWithDetails(req: Request, res: Response): Promise<void> {
    try {
      const requestId = req.params.id;
      const deliveryRequest = await this.requestService.getRequestWithDetails(requestId);

      if (!deliveryRequest) {
        res.status(404).json({
          success: false,
          error: 'Delivery request not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: deliveryRequest
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}