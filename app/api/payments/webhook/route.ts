import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// Webhook for Paystack and Flutterwave
export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-paystack-signature') || req.headers.get('verif-hash')

    // Very basic verification - in production, verify properly using crypto
    // For Paystack:
    // const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(rawBody).digest('hex')
    // if (hash !== signature) return new NextResponse('Invalid signature', { status: 400 })

    const payload = JSON.parse(rawBody)

    // Example handling Paystack charge.success
    if (payload.event === 'charge.success') {
      const reference = payload.data.reference
      const amount = payload.data.amount / 100 // Convert from kobo to NGN
      
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use service role for webhooks normally
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll() {}
          }
        }
      )

      // Update payment status
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'successful' })
        .eq('reference', reference)
        .select()
        .single()

      if (paymentError) {
        console.error('Payment update error:', paymentError)
        return new NextResponse('Error updating payment', { status: 500 })
      }

      // If it's a booking payment, update booking status
      if (payment.booking_id) {
        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', payment.booking_id)
      }

      return NextResponse.json({ status: 'success' })
    }

    return NextResponse.json({ status: 'ignored' })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }
}
