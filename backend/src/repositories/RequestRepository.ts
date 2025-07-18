import { DeliveryRequest } from '../models/DeliveryRequest';
import { RequestStatus } from 'bring-back-shared';

export interface IRequestRepository {
  create(request: DeliveryRequest): Promise<DeliveryRequest>;
  findById(id: string): Promise<DeliveryRequest | null>;
  findByTripId(tripId: string): Promise<DeliveryRequest[]>;
  findByRequesterId(requesterId: string): Promise<DeliveryRequest[]>;
  updateStatus(id: string, status: RequestStatus): Promise<DeliveryRequest | null>;
  acceptRequest(id: string, acceptedAt: Date): Promise<DeliveryRequest | null>;
  completeRequest(id: string, completedAt: Date): Promise<DeliveryRequest | null>;
  delete(id: string): Promise<boolean>;
}

export class RequestRepository implements IRequestRepository {
  async create(request: DeliveryRequest): Promise<DeliveryRequest> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findById(id: string): Promise<DeliveryRequest | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findByTripId(tripId: string): Promise<DeliveryRequest[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async findByRequesterId(requesterId: string): Promise<DeliveryRequest[]> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async updateStatus(id: string, status: RequestStatus): Promise<DeliveryRequest | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async acceptRequest(id: string, acceptedAt: Date): Promise<DeliveryRequest | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async completeRequest(id: string, completedAt: Date): Promise<DeliveryRequest | null> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }

  async delete(id: string): Promise<boolean> {
    // Implementation will be added in later tasks
    throw new Error('Not implemented yet');
  }
}