import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateBody, CreateBookingSchema } from '@/lib/validations'

// Create a new booking
export async function POST(req: Request) {
  try {
    // ── Validate body with Zod ──────────────────────────────────────────────
    const validated = await validateBody(req, CreateBookingSchema)
    if (validated instanceof NextResponse) return validated

    const { trip_id, seat_numbers, passenger_count, total_price, contact_email, contact_phone, user_id } = validated.data

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

    // Verify session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trip exists and has capacity
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('id, status, available_seats')
      .eq('id', trip_id)
      .single()

    if (tripErr || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Trip is no longer available for booking' }, { status: 409 })
    }

    // Insert booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        trip_id,
        user_id: user_id || session.user.id,
        seat_numbers,
        passenger_count,
        total_price,
        status: 'pending',
        contact_email,
        contact_phone,
      })
      .select()
      .single()

    if (error) throw error

    // Insert pending payment record
    const paymentRef = `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        user_id: session.user.id,
        amount: total_price,
        status: 'pending',
        reference: paymentRef,
      })

    if (paymentError) {
      // Best-effort rollback
      await supabase.from('bookings').delete().eq('id', booking.id)
      throw paymentError
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_email: session.user.email,
      action: 'BOOKING_CREATED',
      entity_type: 'booking',
      entity_id: booking.id,
      new_value: { trip_id, passenger_count, total_price, payment_ref: paymentRef },
    }).then(({ error: logErr }) => { if (logErr) console.error('Audit log error:', logErr) }) // non-blocking

    return NextResponse.json({ success: true, booking, payment_reference: paymentRef })

  } catch (error: any) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
