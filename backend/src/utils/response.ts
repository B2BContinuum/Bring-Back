import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from 'bring-back-shared';

/**
 * Send a successful API response
 */
export function sendSuccess<T>(res: Response, data: T, message?: string): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  res.json(response);
}

/**
 * Send an error API response
 */
export function sendError(res: Response, error: string, statusCode: number = 400): void {
  const response: ApiResponse = {
    success: false,
    error
  };
  res.status(statusCode).json(response);
}

/**
 * Send a paginated API response
 */
export function sendPaginated<T>(
  res: Response, 
  data: T[], 
  page: number, 
  limit: number, 
  total: number,
  message?: string
): void {
  const totalPages = Math.ceil(total / limit);
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  };
  res.json(response);
}

/**
 * Send a not found error response
 */
export function sendNotFound(res: Response, resource: string = 'Resource'): void {
  sendError(res, `${resource} not found`, 404);
}

/**
 * Send a validation error response
 */
export function sendValidationError(res: Response, errors: string[]): void {
  const response: ApiResponse = {
    success: false,
    error: 'Validation failed',
    data: errors
  };
  res.status(400).json(response);
}

/**
 * Send an internal server error response
 */
export function sendInternalError(res: Response, message: string = 'Internal server error'): void {
  sendError(res, message, 500);
}