import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWalletThresholds } from '@/lib/wallet/thresholds'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: wallet, error: walletError } = await supabase
      .from('passenger_wallets')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (walletError && walletError.code !== 'PGRST116') { // PGRST116 is not found
      throw walletError
    }

    // If wallet doesn't exist, create it
    let currentWallet = wallet
    if (!currentWallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('passenger_wallets')
        .insert({ user_id: session.user.id })
        .select()
        .single()
      
      if (createError) throw createError
      currentWallet = newWallet
    }

    const thresholds = await getWalletThresholds()
    
    // Fetch recent transactions
    const { data: transactions } = await supabase
      .from('passenger_wallet_transactions')
      .select('*')
      .eq('wallet_id', currentWallet.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const isEligible = currentWallet.spendable_balance >= thresholds.withdrawalThreshold

    return NextResponse.json({
      success: true,
      data: {
        spendableBalance: currentWallet.spendable_balance,
        refundBalance: currentWallet.refund_balance,
        totalBalance: currentWallet.spendable_balance + currentWallet.refund_balance,
        isFrozen: currentWallet.is_frozen,
        withdrawalEligible: isEligible,
        thresholds,
        transactions: transactions || []
      }
    })

  } catch (error: any) {
    console.error('Wallet balance error:', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
