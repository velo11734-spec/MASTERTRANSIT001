'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

export interface PaymentSelectorProps {
  amount: number
  email: string
  fullName: string
  phone: string
  onPaymentSuccess: (reference: string, provider: 'Paystack' | 'Flutterwave') => void
  onCancel: () => void
}

export default function PaymentSelector({
  amount,
  email,
  fullName,
  phone,
  onPaymentSuccess,
  onCancel,
}: PaymentSelectorProps) {
  const t = useTranslations('booking')
  const [selectedMethod, setSelectedMethod] = useState<'paystack' | 'flutterwave'>('paystack')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    setIsProcessing(true)

    // Simulate callback hook mapping
    setTimeout(() => {
      setIsProcessing(false)
      const ref = `MT-REF-${Math.floor(100000 + Math.random() * 900000)}`
      const provider = selectedMethod === 'paystack' ? 'Paystack' : 'Flutterwave'
      onPaymentSuccess(ref, provider)
    }, 1500)
  }

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-gray-800 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white font-outfit">
          Select Payment Gateway
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Choose a secure checkout provider to complete booking escrow.
        </p>
      </div>

      <div className="space-y-3">
        {/* Paystack selector */}
        <button
          type="button"
          onClick={() => setSelectedMethod('paystack')}
          className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
            selectedMethod === 'paystack'
              ? 'bg-[#4f46e5]/10 border-[#4f46e5] text-white'
              : 'bg-[#131320] border-gray-800 text-gray-400 hover:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💳</span>
            <div>
              <span className="font-bold block text-sm text-gray-200">Paystack Checkout</span>
              <span className="text-[10px] text-gray-500">Pay via Card, Bank Transfer, USSD</span>
            </div>
          </div>
          {selectedMethod === 'paystack' && (
            <span className="w-5 h-5 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs text-white">
              ✓
            </span>
          )}
        </button>

        {/* Flutterwave selector */}
        <button
          type="button"
          onClick={() => setSelectedMethod('flutterwave')}
          className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
            selectedMethod === 'flutterwave'
              ? 'bg-[#4f46e5]/10 border-[#4f46e5] text-white'
              : 'bg-[#131320] border-gray-800 text-gray-400 hover:border-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📱</span>
            <div>
              <span className="font-bold block text-sm text-gray-200">Flutterwave Fallback</span>
              <span className="text-[10px] text-gray-500">Mobile Money, Card, Barter Payments</span>
            </div>
          </div>
          {selectedMethod === 'flutterwave' && (
            <span className="w-5 h-5 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs text-white">
              ✓
            </span>
          )}
        </button>
      </div>

      <div className="border-t border-gray-800 pt-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-gray-500 uppercase block tracking-wider">Amount Due</span>
          <span className="text-lg font-bold text-amber-400">₦ {amount.toLocaleString()}</span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200"
          >
            {t('back')}
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={isProcessing}
            className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aec] hover:from-[#6366f1] hover:to-[#8b5cf6] text-white text-xs sm:text-sm font-bold py-2 px-6 rounded-xl transition-all duration-200 shadow-md shadow-indigo-500/10 whitespace-nowrap"
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
