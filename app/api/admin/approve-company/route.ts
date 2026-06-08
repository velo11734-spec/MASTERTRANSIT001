import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  try {
    const { company_id, action, notes } = await req.json()

    if (!company_id || !['approve', 'reject', 'suspend'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Use user client to verify session & role
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to bypass RLS for the actual operation
    const adminSupabase = createAdminClient()

    const newStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'SUSPENDED'

    const { error: updateError } = await adminSupabase
      .from('companies')
      .update({
        status: newStatus,
        verified_at: newStatus === 'APPROVED' ? new Date().toISOString() : null,
        verified_by: newStatus === 'APPROVED' ? session.user.id : null
      })
      .eq('id', company_id)

    if (updateError) throw updateError

    await adminSupabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_email: session.user.email,
      action: `company_${action}`,
      entity_type: 'company',
      entity_id: company_id,
      new_value: { status: newStatus, notes }
    })

    return NextResponse.json({ success: true, status: newStatus })

  } catch (error: any) {
    console.error('Approve company error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
