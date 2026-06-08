import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export type PaymentIntentType =
  | 'WALLET_TOP_UP'
  | 'WALLET_DEBIT'
  | 'REFUND_CREDIT'
  | 'TRIP_PAYMENT'
  | 'VEHICLE_PURCHASE'
  | 'VEHICLE_RENTAL'
  | 'CONVOY_BOOKING'
  | 'WITHDRAWAL'
  | 'COMPANY_SETTLEMENT'
  | 'ADMIN_ADJUSTMENT'

export interface PaymentIntentPayload {
  intent: PaymentIntentType
  entity_id?: string
  entity_type?: string
  user_id: string
}

export class PaymentIntentEngine {
  /**
   * Encodes the payment intent into a metadata object that can be passed to Paystack.
   */
  static createMetadata(
    intent: PaymentIntentType,
    userId: string,
    entityId?: string,
    entityType?: string
  ): Record<string, any> {
    return {
      custom_fields: [
        {
          display_name: 'Payment Intent',
          variable_name: 'payment_intent',
          value: intent,
        },
        {
          display_name: 'User ID',
          variable_name: 'user_id',
          value: userId,
        },
        ...(entityId
          ? [
              {
                display_name: 'Entity ID',
                variable_name: 'entity_id',
                value: entityId,
              },
            ]
          : []),
        ...(entityType
          ? [
              {
                display_name: 'Entity Type',
                variable_name: 'entity_type',
                value: entityType,
              },
            ]
          : []),
      ],
      // Raw metadata for easier programmatic access when verifying
      intent,
      user_id: userId,
      entity_id: entityId,
      entity_type: entityType,
    }
  }

  /**
   * Decodes intent from Paystack metadata
   */
  static extractIntent(metadata: any): PaymentIntentPayload | null {
    if (!metadata || !metadata.intent || !metadata.user_id) {
      return null
    }

    return {
      intent: metadata.intent as PaymentIntentType,
      user_id: metadata.user_id,
      entity_id: metadata.entity_id,
      entity_type: metadata.entity_type,
    }
  }
}
