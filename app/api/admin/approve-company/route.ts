import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { company_id, action, notes } = await req.json()

    if (!company_id || !['approve', 'reject', 'suspend'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
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

    const newStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : 'SUSPENDED'

    const { error: updateError } = await supabase
      .from('companies')
      .update({ 
        status: newStatus,
        verified_at: newStatus === 'APPROVED' ? new Date().toISOString() : null,
        verified_by: newStatus === 'APPROVED' ? session.user.id : null
      })
      .eq('id', company_id)

    if (updateError) throw updateError

    // Log to audit
    await supabase.from('audit_logs').insert({
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
