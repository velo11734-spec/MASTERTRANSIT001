/**
 * RoutePro — Shared Zod validation schemas for all API routes
 * Import and use in route handlers to validate incoming request bodies.
 */
import { z } from 'zod'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Nigerian phone number pattern: starts with +234 or 0 followed by 10 digits */
const nigerianPhone = z
  .string()
  .regex(/^(\+234|0)\d{10}$/, 'Enter a valid Nigerian phone number')

/** UUID v4 */
const uuid = z.string().uuid('Must be a valid UUID')

/** Positive monetary amount in Naira (kobo) */
const positiveAmount = z.number().positive('Amount must be greater than 0')

// ─── Booking Schemas ──────────────────────────────────────────────────────────

export const CreateBookingSchema = z.object({
  trip_id: uuid,
  seat_numbers: z.array(z.string()).min(1, 'At least one seat is required'),
  passenger_count: z.number().int().min(1).max(50),
  total_price: positiveAmount,
  contact_email: z.string().email('Enter a valid email address'),
  contact_phone: nigerianPhone.optional(),
  user_id: uuid.optional(),
})

export const CancelBookingSchema = z.object({
  reason: z.string().min(5, 'Please provide a reason').max(500).optional(),
})

// ─── Payment Schemas ──────────────────────────────────────────────────────────

export const VerifyPaymentSchema = z.object({
  reference: z.string().min(5, 'Missing payment reference'),
  booking_id: uuid.optional(),
})

export const WebhookPayloadSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string(),
    status: z.string(),
    amount: z.number().optional(),
    customer: z
      .object({
        email: z.string().email().optional(),
      })
      .optional(),
    metadata: z
      .object({
        booking_id: z.string().optional(),
        user_id: z.string().optional(),
      })
      .optional(),
  }),
})

// ─── Admin Action Schemas ─────────────────────────────────────────────────────

export const ApproveCompanySchema = z.object({
  company_id: uuid,
  notes: z.string().max(500).optional(),
})

export const SuspendUserSchema = z.object({
  user_id: uuid,
  reason: z.string().min(5, 'Provide a suspension reason').max(500),
})

export const ProcessPayoutSchema = z.object({
  company_id: uuid,
  amount: positiveAmount,
  bank_code: z.string().min(3),
  account_number: z.string().length(10, 'Account number must be 10 digits'),
  narration: z.string().max(255).optional(),
})

export const RefundSchema = z.object({
  booking_id: uuid,
  amount: positiveAmount,
  reason: z.string().min(5, 'Provide a refund reason').max(500),
})

// ─── Company Registration ─────────────────────────────────────────────────────

export const CompanyApplicationSchema = z.object({
  name: z.string().min(2, 'Company name is required').max(150),
  cac_number: z.string().min(5, 'CAC number is required'),
  phone: nigerianPhone,
  address: z.string().min(5, 'Address is required').max(300),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  business_roles: z.array(z.string()).min(1, 'Select at least one business role'),
  bank_name: z.string().min(2),
  account_number: z.string().length(10, 'Account number must be 10 digits'),
  account_name: z.string().min(3),
})

// ─── Support Ticket ───────────────────────────────────────────────────────────

export const SupportTicketSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: nigerianPhone.optional().or(z.literal('')),
  ticket_type: z.enum([
    'booking_issue',
    'payment_problem',
    'company_complaint',
    'technical_issue',
    'account_issue',
    'other',
  ]),
  booking_ref: z.string().max(50).optional(),
  subject: z.string().min(5).max(200),
  description: z.string().min(20, 'Please describe the issue in detail').max(3000),
})

// ─── Vehicle Listing ──────────────────────────────────────────────────────────

export const VehicleListingSchema = z.object({
  title: z.string().min(3).max(150),
  vehicle_type: z.string().min(2).max(50),
  model: z.string().min(2).max(100),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  price: positiveAmount,
  capacity: z.number().int().min(1).max(100),
  is_featured: z.boolean().optional(),
})

// ─── Rental Listing ───────────────────────────────────────────────────────────

export const RentalListingSchema = z.object({
  title: z.string().min(3).max(150),
  vehicle_type: z.string().min(2).max(50),
  capacity: z.number().int().min(1).max(100),
  daily_rate: positiveAmount,
  pickup_location: z.string().min(3).max(200),
})

// ─── Type exports ─────────────────────────────────────────────────────────────

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>
export type VerifyPaymentInput = z.infer<typeof VerifyPaymentSchema>
export type ApproveCompanyInput = z.infer<typeof ApproveCompanySchema>
export type SuspendUserInput = z.infer<typeof SuspendUserSchema>
export type RefundInput = z.infer<typeof RefundSchema>
export type SupportTicketInput = z.infer<typeof SupportTicketSchema>
export type VehicleListingInput = z.infer<typeof VehicleListingSchema>

// ─── Validation helper ────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'

/**
 * Validate a request body against a Zod schema.
 * Returns { data } on success, or a 400 NextResponse on failure.
 */
export async function validateBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | NextResponse> {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      )
    }
    return { data: result.data }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
}
