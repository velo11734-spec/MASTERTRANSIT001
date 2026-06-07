import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cancel a booking
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params
    const { reason } = await req.json()

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

    // Verify ownership or admin
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('user_id, status')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if user is owner. (For admin, we'd check roles, omitted for simplicity unless using service role)
    if (booking.user_id !== session.user.id) {
       // Allow if admin (requires profile check)
       const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
       if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
       }
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return NextResponse.json({ error: `Cannot cancel a ${booking.status} booking` }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('id', bookingId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Cancel booking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
