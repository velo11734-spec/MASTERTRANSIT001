import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { payment_id, refund_amount, reason } = await req.json()

    if (!payment_id || !refund_amount) {
      return NextResponse.json({ error: 'Missing payment_id or refund_amount' }, { status: 400 })
    }

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

    // Verify admin
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Here we would call the payment gateway refund API
    // e.g., Paystack Refund API
    
    const { error: updateError } = await supabase
      .from('payments')
      .update({ 
        status: 'refunded'
      })
      .eq('id', payment_id)

    if (updateError) throw updateError

    // Log to audit
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_email: session.user.email,
      action: 'process_refund',
      entity_type: 'payment',
      entity_id: payment_id,
      new_value: { amount: refund_amount, reason }
    })

    return NextResponse.json({ success: true, status: 'refunded' })

  } catch (error: any) {
    console.error('Process refund error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
