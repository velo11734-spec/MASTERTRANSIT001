import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface WalletThresholds {
  minFunding: number
  withdrawalThreshold: number
  autoBankRefundThreshold: number
  manualReviewThreshold: number
  maxDailyWithdrawal: number
  withdrawalFeePct: number
  approvalRequired: boolean
  highValueOtpThreshold: number
}

const DEFAULT_THRESHOLDS: WalletThresholds = {
  minFunding: 500,
  withdrawalThreshold: 50000,
  autoBankRefundThreshold: 250000,
  manualReviewThreshold: 1000000,
  maxDailyWithdrawal: 500000,
  withdrawalFeePct: 0,
  approvalRequired: true,
  highValueOtpThreshold: 500000,
}

export async function getWalletThresholds(): Promise<WalletThresholds> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value')
      .eq('category', 'wallet')

    if (error || !data || data.length === 0) {
      return DEFAULT_THRESHOLDS
    }

    const settingsMap = Object.fromEntries(data.map((item) => [item.key, item.value]))

    return {
      minFunding: Number(settingsMap.wallet_min_funding) || DEFAULT_THRESHOLDS.minFunding,
      withdrawalThreshold: Number(settingsMap.wallet_withdrawal_threshold) || DEFAULT_THRESHOLDS.withdrawalThreshold,
      autoBankRefundThreshold: Number(settingsMap.wallet_auto_bank_refund_threshold) || DEFAULT_THRESHOLDS.autoBankRefundThreshold,
      manualReviewThreshold: Number(settingsMap.wallet_manual_review_threshold) || DEFAULT_THRESHOLDS.manualReviewThreshold,
      maxDailyWithdrawal: Number(settingsMap.wallet_max_daily_withdrawal) || DEFAULT_THRESHOLDS.maxDailyWithdrawal,
      withdrawalFeePct: Number(settingsMap.wallet_withdrawal_fee_pct) || DEFAULT_THRESHOLDS.withdrawalFeePct,
      approvalRequired: settingsMap.wallet_withdrawal_approval_required === 'true',
      highValueOtpThreshold: Number(settingsMap.wallet_high_value_otp_threshold) || DEFAULT_THRESHOLDS.highValueOtpThreshold,
    }
  } catch (error) {
    console.error('Error fetching wallet thresholds:', error)
    return DEFAULT_THRESHOLDS
  }
}

export function isWithdrawalEligible(balance: number, thresholds: WalletThresholds): boolean {
  return balance >= thresholds.withdrawalThreshold
}

export function requiresAutoRefund(amount: number, thresholds: WalletThresholds): boolean {
  return amount >= thresholds.autoBankRefundThreshold
}
