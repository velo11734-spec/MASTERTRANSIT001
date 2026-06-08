import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PaymentIntentEngine } from '@/lib/payment-intent/engine'
import { getWalletThresholds } from '@/lib/wallet/thresholds'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await req.json()

    if (!amount || isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const thresholds = await getWalletThresholds()
    
    if (amount < thresholds.minFunding) {
      return NextResponse.json({ error: `Minimum funding amount is ₦${thresholds.minFunding}` }, { status: 400 })
    }

    // Generate a unique reference
    const reference = `WAL-TOP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

    // Create payment metadata using Payment Intent Engine
    const metadata = PaymentIntentEngine.createMetadata('WALLET_TOP_UP', session.user.id)

    // Log the initiation
    await supabase.from('payments').insert({
      user_id: session.user.id,
      amount,
      reference,
      gateway: 'paystack',
      status: 'pending',
      metadata,
    })

    return NextResponse.json({
      success: true,
      reference,
      amount: amount * 100, // Convert to kobo
      email: session.user.email,
      metadata
    })

  } catch (error: any) {
    console.error('Wallet funding error:', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
