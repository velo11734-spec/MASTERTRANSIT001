'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, ShieldCheck, CheckCircle, Download, Smartphone } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function BookTripPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const tripId = params.id as string
  
  const seatsParam = searchParams.get('seats') || ''
  const selectedSeats = seatsParam ? seatsParam.split(',') : []
  const basePrice = parseFloat(searchParams.get('price') || '0')
  const totalAmount = selectedSeats.length * basePrice

  const [loading, setLoading] = useState(false)
  const [passengerDetails, setPassengerDetails] = useState<{ name: string; phone: string }[]>(
    selectedSeats.map(() => ({ name: '', phone: '' }))
  )
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  const handleInputChange = (idx: number, field: 'name' | 'phone', value: string) => {
    setPassengerDetails(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      // Create main booking record
      const qrCodeHash = `MT-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`
      
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .insert({
          trip_id: tripId.startsWith('demo') ? null : tripId, // Set to null if it's a demo trip to avoid foreign key errors, or use valid uuid
          user_id: userId,
          status: 'BOOKED',
          total_amount: totalAmount,
          currency: 'NGN',
          commission_amount: totalAmount * 0.1, // 10% commission
          qr_code_hash: qrCodeHash
        })
        .select('id')
        .single()

      if (bookingErr && !tripId.startsWith('demo')) {
        throw bookingErr
      }

      const bookingId = booking?.id || 'demo-booking-uuid-placeholder'

      // Create passengers records
      for (let i = 0; i < selectedSeats.length; i++) {
        const passenger = passengerDetails[i]
        const { error: passErr } = await supabase
          .from('booking_passengers')
          .insert({
            booking_id: tripId.startsWith('demo') ? null : bookingId,
            seat_id: selectedSeats[i],
            passenger_name: passenger.name || 'Passenger ' + (i + 1),
            passenger_phone: passenger.phone || '08000000000',
            ticket_status: 'BOOKED'
          })

        if (passErr && !tripId.startsWith('demo')) throw passErr
      }

      // Record mock payment in payments table
      const { error: payErr } = await supabase
        .from('payments')
        .insert({
          booking_id: tripId.startsWith('demo') ? null : bookingId,
          provider: 'Paystack',
          provider_ref: `REF-${Math.floor(Math.random() * 100000000)}`,
          amount: totalAmount,
          currency: 'NGN',
          status: 'SUCCESSFUL'
        })

      if (payErr && !tripId.startsWith('demo')) throw payErr

      setBookingRef(qrCodeHash)
      setPaymentSuccess(true)
    } catch (err: any) {
      console.error('Booking creation error:', err)
      alert(err.message || 'An error occurred during booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (paymentSuccess) {
    return (
      <div style={{ background: '#F8FAFC', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div className="mt-card" style={{ width: '100%', maxWidth: 480, padding: 32, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={36} color="#16A34A" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Booking Successful!</h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 6 }}>
            Your transaction has been approved and seats are locked.
          </p>

          <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 12, padding: 20, margin: '24px 0', textAlign: 'left' }}>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>TICKET REFERENCE</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', marginTop: 2 }}>{bookingRef}</p>

            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 12 }}>SEATS</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginTop: 2 }}>{selectedSeats.join(', ')}</p>

            <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 12 }}>TOTAL AMOUNT PAID</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#16A34A', marginTop: 2 }}>₦{totalAmount.toLocaleString()}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button 
              onClick={() => alert('Downloading PDF Ticket containing QR Code...')}
              className="mt-btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 12 }}
            >
              <Download size={16} /> Download Digital Ticket
            </button>
            <Link href="/en/dashboard" className="mt-btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 12, textDecoration: 'none' }}>
              Go to Passenger Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {/* Back Link */}
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', marginBottom: 20, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Seat Selection
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
          
          {/* Passenger Info Form */}
          <div className="mt-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 16 }}>Passenger Information</h2>
            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedSeats.map((seatId, idx) => (
                <div key={seatId} style={{ borderBottom: idx < selectedSeats.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', marginBottom: 8 }}>Seat {seatId} details</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label className="mt-label">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="John Doe" 
                        value={passengerDetails[idx].name} 
                        onChange={e => handleInputChange(idx, 'name', e.target.value)}
                        className="mt-input" 
                      />
                    </div>
                    <div>
                      <label className="mt-label">Phone Number</label>
                      <input 
                        type="tel" 
                        required 
                        placeholder="08000000000" 
                        value={passengerDetails[idx].phone} 
                        onChange={e => handleInputChange(idx, 'phone', e.target.value)}
                        className="mt-input" 
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 12 }}>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="mt-btn-primary" 
                  style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <CreditCard size={18} /> {loading ? 'Processing payment...' : `Pay ₦${totalAmount.toLocaleString()} via Paystack`}
                </button>
              </div>
            </form>
          </div>

          {/* Fare Summary Column */}
          <div>
            <div className="mt-card" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Fare Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}>
                  <span>Fare ({selectedSeats.length} seats)</span>
                  <span>₦{(selectedSeats.length * basePrice).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748B' }}>
                  <span>Vat & Fees</span>
                  <span>₦0</span>
                </div>
                <div style={{ height: 1, background: '#E2E8F0', margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  <span>Total Pay</span>
                  <span style={{ color: '#16A34A' }}>₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 16, display: 'flex', gap: 10 }}>
              <ShieldCheck size={20} color="#16A34A" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: '#14532D', lineHeight: 1.4 }}>
                Escrow Guarantee: Your funds are secure. Payments are held in platform escrow until completion of the travel route.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
