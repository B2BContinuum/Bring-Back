import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required')
});

// User validation schemas
export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, 'Name is required'),
  phone: phoneSchema,
  address: addressSchema,
  profileImage: z.string().url().optional()
});

// Trip validation schemas
export const createTripSchema = z.object({
  destination: z.object({
    id: z.string(),
    name: z.string(),
    address: addressSchema,
    coordinates: coordinatesSchema,
    category: z.enum(['grocery', 'pharmacy', 'retail', 'restaurant', 'other']),
    verified: z.boolean(),
    currentUserCount: z.number().min(0)
  }),
  departureTime: z.string().datetime(),
  estimatedReturnTime: z.string().datetime(),
  capacity: z.number().min(1).max(10),
  description: z.string().optional()
});

// Request validation schemas
export const createRequestSchema = z.object({
  tripId: z.string().uuid(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().min(1),
    estimatedPrice: z.number().min(0),
    imageUrl: z.string().url().optional()
  })).min(1),
  deliveryAddress: addressSchema,
  maxItemBudget: z.number().min(0),
  deliveryFee: z.number().min(0),
  specialInstructions: z.string().optional()
});

// Location validation schemas
export const createLocationSchema = z.object({
  name: z.string().min(1),
  address: addressSchema,
  coordinates: coordinatesSchema,
  category: z.enum(['grocery', 'pharmacy', 'retail', 'restaurant', 'other']),
  verified: z.boolean().default(false)
});

export const locationSearchSchema = z.object({
  query: z.string().optional(),
  category: z.enum(['grocery', 'pharmacy', 'retail', 'restaurant', 'other']).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radius: z.number().min(0.1).max(100).default(10).optional()
});

// Helper function to validate request body
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}