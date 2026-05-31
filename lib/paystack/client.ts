/**
 * Paystack payment utility wrapper
 * Handles client-side inline checkout popup trigger & server-side verification callbacks
 */

export interface PaystackTransactionParams {
  email: string
  amount: number // In Kobo (Naira * 100)
  reference: string
  currency?: string
  metadata?: any
}

export function loadPaystackScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if ((window as any).PaystackPop) return resolve(true)

    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function initializePaystackCheckout({
  email,
  amount,
  reference,
  currency = 'NGN',
  metadata = {},
  onSuccess,
  onClose,
}: PaystackTransactionParams & {
  onSuccess: (response: any) => void
  onClose: () => void
}) {
  const isLoaded = await loadPaystackScript()
  if (!isLoaded) {
    alert('Failed to load Paystack payment gateway. Please check your connection.')
    return
  }

  const handler = (window as any).PaystackPop.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_replace_with_your_paystack_public_key',
    email,
    amount,
    currency,
    ref: reference,
    metadata,
    callback: function (response: any) {
      onSuccess(response)
    },
    onClose: function () {
      onClose()
    },
  })

  handler.openIframe()
}
