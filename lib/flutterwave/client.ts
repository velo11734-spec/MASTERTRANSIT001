/**
 * Flutterwave checkout integration client wrapper
 */

export interface FlutterwaveTransactionParams {
  public_key: string
  tx_ref: string
  amount: number
  currency: string
  payment_options?: string
  customer: {
    email: string
    phone_number: string
    name: string
  }
  customizations: {
    title: string
    description: string
    logo?: string
  }
}

export function loadFlutterwaveScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if ((window as any).FlutterwaveCheckout) return resolve(true)

    const script = document.createElement('script')
    script.src = 'https://checkout.flutterwave.com/v3.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function initializeFlutterwaveCheckout({
  tx_ref,
  amount,
  currency = 'NGN',
  customer,
  customizations,
  onSuccess,
  onClose,
}: Omit<FlutterwaveTransactionParams, 'public_key'> & {
  onSuccess: (response: any) => void
  onClose: () => void
}) {
  const isLoaded = await loadFlutterwaveScript()
  if (!isLoaded) {
    alert('Failed to load Flutterwave payment gateway. Please check your connection.')
    return
  }

  const publicKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-replace_with_flutterwave_key'

  const handler = (window as any).FlutterwaveCheckout({
    public_key: publicKey,
    tx_ref,
    amount,
    currency,
    payment_options: 'card,mobilemoney,ussd',
    customer,
    customizations,
    callback: function (response: any) {
      onSuccess(response)
    },
    onclose: function () {
      onClose()
    },
  })
}
