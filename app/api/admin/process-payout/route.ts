import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { payout_id, company_id, action, amount, notes } = await req.json()

    if (!payout_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminSupabase = createAdminClient()
    const newStatus = action === 'approve' ? 'paid' : 'rejected'

    const { error: updateError } = await adminSupabase
      .from('payouts')
      .update({
        status: newStatus,
        processed_at: new Date().toISOString(),
        processed_by: session.user.id,
        notes
      })
      .eq('id', payout_id)

    if (updateError) throw updateError

    await adminSupabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_email: session.user.email,
      action: `payout_${action}`,
      entity_type: 'payout',
      entity_id: payout_id,
      new_value: { status: newStatus, amount, notes }
    })

    return NextResponse.json({ success: true, status: newStatus })

  } catch (error: any) {
    console.error('Process payout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
