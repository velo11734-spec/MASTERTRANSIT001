import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateBody, VerifyPaymentSchema } from '@/lib/validations'
import { PaymentIntentEngine } from '@/lib/payment-intent/engine'

export async function POST(req: Request) {
  try {
    // ── Validate body ───────────────────────────────────────────────────────
    const validated = await validateBody(req, VerifyPaymentSchema)
    if (validated instanceof NextResponse) return validated

    const { reference, booking_id } = validated.data

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    )

    // Require authenticated session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify via Paystack
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecret) {
      throw new Error('Payment gateway not configured')
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!verifyResponse.ok) {
      return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
    }

    const verifyData = await verifyResponse.json()

    if (verifyData.status && verifyData.data?.status === 'success') {
      const intentPayload = PaymentIntentEngine.extractIntent(verifyData.data?.metadata)

      // 1. Update general payment record
      await supabase
        .from('payments')
        .update({
          status: 'successful',
          paid_at: new Date().toISOString(),
          gateway_response: verifyData.data,
        })
        .eq('reference', reference)

      // 2. Route based on Payment Intent
      if (intentPayload) {
        if (intentPayload.intent === 'WALLET_TOP_UP') {
          // Add to spendable balance
          const amountInNaira = verifyData.data.amount / 100 // Paystack returns kobo
          
          const { data: wallet } = await supabase
            .from('passenger_wallets')
            .select('id, spendable_balance')
            .eq('user_id', intentPayload.user_id)
            .single()

          if (wallet) {
            const newBalance = (wallet.spendable_balance || 0) + amountInNaira
            await supabase
              .from('passenger_wallets')
              .update({ spendable_balance: newBalance })
              .eq('id', wallet.id)

            // Create wallet transaction
            await supabase.from('passenger_wallet_transactions').insert({
              wallet_id: wallet.id,
              transaction_intent: 'WALLET_TOP_UP',
              payment_method: 'paystack',
              amount: amountInNaira,
              balance_after: newBalance,
              status: 'completed',
              description: 'Wallet funding via Paystack',
              linked_entity_id: reference,
              linked_entity_type: 'payment'
            })
          }
        }
        else if (intentPayload.intent === 'TRIP_PAYMENT') {
           // Existing booking confirmation logic
           if (intentPayload.entity_id || booking_id) {
             await supabase
               .from('bookings')
               .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
               .eq('id', intentPayload.entity_id || booking_id)
           }
        }
      } else {
        // Fallback for payments without intent metadata
        if (booking_id) {
          await supabase
            .from('bookings')
            .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
            .eq('id', booking_id)
        }
      }

      // 3. Audit log
      await supabase.from('audit_logs').insert({
        actor_id: session.user.id,
        actor_email: session.user.email,
        action: 'PAYMENT_VERIFIED',
        entity_type: 'payment',
        entity_id: reference,
        new_value: { booking_id, intent: intentPayload?.intent, amount: verifyData.data?.amount, status: 'successful' },
      }).then(({ error: logErr }) => { if (logErr) console.error('Audit log error:', logErr) }) // non-blocking

      return NextResponse.json({ success: true, data: verifyData.data })
    }

    return NextResponse.json(
      { success: false, error: 'Payment not confirmed by gateway', gateway_status: verifyData.data?.status },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
