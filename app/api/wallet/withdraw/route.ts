import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWalletThresholds } from '@/lib/wallet/thresholds'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, bankAccount } = await req.json()

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!bankAccount) {
      return NextResponse.json({ error: 'Bank account details are required' }, { status: 400 })
    }

    const thresholds = await getWalletThresholds()

    // 1. Fetch wallet
    const { data: wallet, error: walletError } = await supabase
      .from('passenger_wallets')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
    }

    if (wallet.is_frozen) {
      return NextResponse.json({ error: 'Wallet is frozen. Please contact support.' }, { status: 403 })
    }

    // 2. Check balance
    if (wallet.spendable_balance < amount) {
      return NextResponse.json({ error: 'Insufficient spendable balance' }, { status: 400 })
    }

    // 3. Check withdrawal threshold
    if (wallet.spendable_balance < thresholds.withdrawalThreshold) {
      return NextResponse.json({ error: `Withdrawals are only allowed for balances above ₦${thresholds.withdrawalThreshold}` }, { status: 400 })
    }

    if (amount > thresholds.maxDailyWithdrawal) {
      return NextResponse.json({ error: `Maximum daily withdrawal limit is ₦${thresholds.maxDailyWithdrawal}` }, { status: 400 })
    }

    // High value check
    if (amount >= thresholds.highValueOtpThreshold) {
      // Logic for high value check if needed. E.g. prompt for OTP.
      // For now, we will just proceed but flag it. 
      // In a real flow, we'd send OTP, return { requireOTP: true }, then verify OTP before finalizing.
    }

    // 4. Calculate fee
    const fee = (amount * thresholds.withdrawalFeePct) / 100
    const netAmount = amount - fee

    // 5. Create Withdrawal Request (status pending, or approved if approval is false)
    const status = thresholds.approvalRequired ? 'pending' : 'approved'

    // Use RPC or a transaction to deduct balance safely and create the request
    // For now, we will do sequential updates as an MVP, but a postgres function is safer.
    
    const { data: request, error: requestError } = await supabase
      .from('passenger_withdrawal_requests')
      .insert({
        user_id: session.user.id,
        wallet_id: wallet.id,
        amount: netAmount,
        bank_account: bankAccount,
        status
      })
      .select()
      .single()

    if (requestError) {
      throw requestError
    }

    // Deduct the balance
    await supabase
      .from('passenger_wallets')
      .update({ spendable_balance: wallet.spendable_balance - amount })
      .eq('id', wallet.id)

    // Log the transaction
    await supabase.from('passenger_wallet_transactions').insert({
      wallet_id: wallet.id,
      transaction_intent: 'WITHDRAWAL',
      payment_method: 'bank_transfer',
      status: 'pending',
      amount: -amount,
      balance_after: wallet.spendable_balance - amount,
      description: `Withdrawal request to ${bankAccount.accountNumber || 'Bank'}`,
      linked_entity_id: request.id,
      linked_entity_type: 'withdrawal_request'
    })

    return NextResponse.json({ success: true, request })

  } catch (error: any) {
    console.error('Wallet withdrawal error:', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
