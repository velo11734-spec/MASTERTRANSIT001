'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Clock, CreditCard, AlertCircle, ArrowRight, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { initializePaystackCheckout } from '@/lib/paystack/client'

type CartItem = {
  id: string
  trip_id: string
  seat_number: string
  amount: number
  expires_at: string
  trips?: {
    departure_time: string
    route_id: string
    routes?: { origin: string; destination: string }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'wallet'>('paystack')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function fetchCart() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/en/login')
        return
      }
      setUserEmail(user.email || '')
      setUserId(user.id)

      // Fetch active cart reservations
      const { data, error } = await supabase
        .from('cart_reservations')
        .select(`
          id, trip_id, seat_number, amount, expires_at,
          trips:trip_id (
            departure_time,
            routes:route_id ( origin, destination )
          )
        `)
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())

      if (!error && data) {
        setCartItems(data as any)
      }
      
      // Fetch wallet balance
      try {
        const res = await fetch('/api/wallet/balance')
        const wData = await res.json()
        if (wData.success && wData.data) {
          setWalletBalance(wData.data.spendableBalance || 0)
        }
      } catch (err) {
        console.error('Failed to load wallet', err)
      }

      setLoading(false)
    }

    fetchCart()
  }, [router])

  const totalAmount = cartItems.reduce((sum, item) => sum + Number(item.amount), 0)
  const canUseWallet = walletBalance >= totalAmount

  const handlePaystackPayment = () => {
    setProcessing(true)
    
    // Generate an entity ID (using the first cart item's trip ID or a custom reference)
    const entityId = cartItems.length > 0 ? cartItems[0].trip_id : 'checkout'
    
    // PaymentIntentEngine metadata format
    const metadata = {
      custom_fields: [
        { display_name: 'Payment Intent', variable_name: 'payment_intent', value: 'TRIP_PAYMENT' },
        { display_name: 'User ID', variable_name: 'user_id', value: userId },
        { display_name: 'Entity ID', variable_name: 'entity_id', value: entityId },
      ],
      intent: 'TRIP_PAYMENT',
      user_id: userId,
      entity_id: entityId,
    }

    initializePaystackCheckout({
      email: userEmail,
      amount: totalAmount * 100, // kobo
      reference: `TRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      metadata,
      onSuccess: async (response) => {
        // 1. Move items from cart to bookings
        const bookingsData = cartItems.map(item => ({
          user_id: userId,
          trip_id: item.trip_id,
          seat_number: item.seat_number,
          amount: item.amount,
          total_amount: item.amount,
          status: 'confirmed',
          payment_method: 'paystack',
          booking_reference: response.reference
        }))

        const { error: insertError } = await supabase.from('bookings').insert(bookingsData)
        
        if (!insertError) {
          // 2. Delete cart items
          await supabase.from('cart_reservations').delete().in('id', cartItems.map(i => i.id))
          
          // Verify on backend asynchronously
          fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: response.reference })
          }).catch(console.error)
          
          router.push('/en/e-tickets')
        } else {
          alert('Payment successful but booking failed to save. Please contact support with reference: ' + response.reference)
          setProcessing(false)
        }
      },
      onClose: () => {
        setProcessing(false)
      }
    })
  }

  const handleWalletPayment = async () => {
    if (!canUseWallet) return
    setProcessing(true)

    try {
      // 1. Deduct wallet balance (In a real app, use an API route to handle this atomically)
      // Since this is MVP, we do it via client, but ideally should hit a /api/checkout endpoint.
      const { data: wallet } = await supabase
        .from('passenger_wallets')
        .select('id, spendable_balance')
        .eq('user_id', userId)
        .single()

      if (!wallet || wallet.spendable_balance < totalAmount) {
        throw new Error('Insufficient wallet balance')
      }

      // 2. Update wallet
      const newBalance = wallet.spendable_balance - totalAmount
      await supabase
        .from('passenger_wallets')
        .update({ spendable_balance: newBalance })
        .eq('id', wallet.id)
      
      const reference = `WAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // 3. Log transaction
      await supabase.from('passenger_wallet_transactions').insert({
        wallet_id: wallet.id,
        transaction_intent: 'WALLET_DEBIT',
        payment_method: 'wallet',
        status: 'completed',
        amount: -totalAmount,
        balance_after: newBalance,
        description: 'Trip Booking Payment',
        linked_entity_id: reference,
        linked_entity_type: 'booking'
      })

      // 4. Move items to bookings
      const bookingsData = cartItems.map(item => ({
        user_id: userId,
        trip_id: item.trip_id,
        seat_number: item.seat_number,
        amount: item.amount,
        total_amount: item.amount,
        status: 'confirmed',
        payment_method: 'wallet',
        booking_reference: reference
      }))

      const { error: insertError } = await supabase.from('bookings').insert(bookingsData)

      if (!insertError) {
        await supabase.from('cart_reservations').delete().in('id', cartItems.map(i => i.id))
        router.push('/en/e-tickets')
      } else {
        throw new Error('Failed to create booking records')
      }

    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Payment failed')
      setProcessing(false)
    }
  }

  const handlePayment = () => {
    if (paymentMethod === 'paystack') {
      handlePaystackPayment()
    } else {
      handleWalletPayment()
    }
  }

  // Timer Component
  const Countdown = ({ expiresAt }: { expiresAt: string }) => {
    const [timeLeft, setTimeLeft] = useState(Math.max(0, new Date(expiresAt).getTime() - new Date().getTime()))

    useEffect(() => {
      const timer = setInterval(() => {
        const newTime = Math.max(0, new Date(expiresAt).getTime() - new Date().getTime())
        setTimeLeft(newTime)
        if (newTime === 0) {
          window.location.reload()
        }
      }, 1000)
      return () => clearInterval(timer)
    }, [expiresAt])

    const minutes = Math.floor(timeLeft / 60000)
    const seconds = ((timeLeft % 60000) / 1000).toFixed(0)

    return (
      <span style={{ color: timeLeft < 300000 ? '#DC2626' : '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Clock size={16} /> {minutes}:{Number(seconds) < 10 ? '0' : ''}{seconds}
      </span>
    )
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>Loading checkout...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '60px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: '#10B981', borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <ShoppingCart size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Checkout</h1>
        </div>

        {cartItems.length === 0 ? (
          <div className="mt-card" style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ width: 80, height: 80, background: '#F1F5F9', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: '#94A3B8' }}>
              <ShoppingCart size={40} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Your Cart is Empty</h2>
            <p style={{ color: '#64748B', marginBottom: 32 }}>Any tickets you reserve will appear here for 1 hour.</p>
            <Link href="/en/search" className="mt-btn-primary" style={{ textDecoration: 'none', padding: '12px 32px' }}>
              Find a Trip
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            
            {/* Cart Items */}
            <div style={{ flex: 2, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="mt-card" style={{ padding: 20, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: 8 }} />
                <div>
                  <h4 style={{ fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>Reservation Timer</h4>
                  <p style={{ fontSize: 14, color: '#B91C1C' }}>Tickets in your cart are reserved for 1 hour. If payment is not completed, they will be released to other travellers.</p>
                </div>
              </div>

              {cartItems.map((item) => {
                const origin = item.trips?.routes?.origin || 'Unknown'
                const destination = item.trips?.routes?.destination || 'Unknown'
                
                return (
                  <div key={item.id} className="mt-card" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 18 }}>{origin}</span>
                        <ArrowRight size={16} color="#94A3B8" />
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 18 }}>{destination}</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 4 }}>Seat: <span style={{ fontWeight: 600, color: '#0F172A' }}>{item.seat_number}</span></p>
                      <p style={{ fontSize: 14, color: '#64748B' }}>Amount: <span style={{ fontWeight: 700, color: '#16A34A' }}>₦{item.amount}</span></p>
                    </div>
                    
                    <div style={{ textAlign: 'right', background: '#F8FAFC', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <p style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Expires in</p>
                      <Countdown expiresAt={item.expires_at} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Payment Summary */}
            <div className="mt-card" style={{ flex: 1, minWidth: 300, padding: 32, position: 'sticky', top: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 24, borderBottom: '1px solid #F1F5F9', paddingBottom: 16 }}>Order Summary</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ color: '#64748B' }}>Subtotal ({cartItems.length} items)</span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>₦{totalAmount}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, paddingTop: 16, borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 18 }}>Total Pay</span>
                <span style={{ fontWeight: 800, color: '#16A34A', fontSize: 24 }}>₦{totalAmount}</span>
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Select Payment Method</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* RoutePro Wallet Option */}
                  <label style={{ 
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, 
                    border: `1.5px solid ${paymentMethod === 'wallet' ? '#16A34A' : '#E2E8F0'}`, 
                    borderRadius: 12, cursor: canUseWallet ? 'pointer' : 'not-allowed',
                    background: paymentMethod === 'wallet' ? '#F0FDF4' : (canUseWallet ? 'white' : '#F8FAFC'),
                    opacity: canUseWallet ? 1 : 0.6
                  }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="wallet"
                      checked={paymentMethod === 'wallet'}
                      onChange={() => canUseWallet && setPaymentMethod('wallet')}
                      disabled={!canUseWallet}
                      style={{ marginTop: 4 }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Wallet size={16} /> RoutePro Wallet
                      </p>
                      <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                        Balance: ₦{walletBalance.toLocaleString()}
                      </p>
                      {!canUseWallet && (
                        <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>Insufficient balance. Top up first.</p>
                      )}
                    </div>
                  </label>

                  {/* Paystack Option */}
                  <label style={{ 
                    display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16, 
                    border: `1.5px solid ${paymentMethod === 'paystack' ? '#16A34A' : '#E2E8F0'}`, 
                    borderRadius: 12, cursor: 'pointer',
                    background: paymentMethod === 'paystack' ? '#F0FDF4' : 'white'
                  }}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="paystack"
                      checked={paymentMethod === 'paystack'}
                      onChange={() => setPaymentMethod('paystack')}
                      style={{ marginTop: 4 }}
                    />
                    <div>
                      <p style={{ fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CreditCard size={16} /> Pay with Paystack
                      </p>
                      <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                        Cards, Bank Transfers, USSD
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                onClick={handlePayment}
                disabled={processing}
                className="mt-btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
              >
                {processing ? 'Processing...' : (paymentMethod === 'wallet' ? 'Pay from Wallet' : 'Pay with Paystack')}
              </button>
              
              <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 16 }}>Secure payment processing.</p>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
