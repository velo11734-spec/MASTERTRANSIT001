import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { user_id, suspend, reason } = await req.json()

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
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

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        is_suspended: suspend,
        suspended_at: suspend ? new Date().toISOString() : null,
        suspension_reason: suspend ? reason : null
      })
      .eq('id', user_id)

    if (updateError) throw updateError

    // Log to audit
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_email: session.user.email,
      action: suspend ? 'suspend_user' : 'reactivate_user',
      entity_type: 'user',
      entity_id: user_id,
      new_value: { is_suspended: suspend, reason }
    })

    return NextResponse.json({ success: true, suspended: suspend })

  } catch (error: any) {
    console.error('Suspend user error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
