'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Share2, ArrowRight, MapPin, Clock, Bus, User, Phone, CheckCircle2 } from 'lucide-react'
import QRCode from 'react-qr-code'

const mockBooking = {
  id: 'BK001',
  qrValue: 'ROUTEPRO-BK001-2024',
  from: 'Lagos', to: 'Abuja',
  departureDate: 'Tuesday, 28 May 2024',
  departureTime: '08:00 AM',
  arrivalTime: '02:30 PM',
  company: 'ABC Transport',
  companyInitials: 'AT',
  companyColor: '#1E40AF',
  vehicle: 'Luxury Coach A001',
  seat: 'B3',
  class: 'Executive',
  passenger: 'Feranmi Ajibade',
  phone: '+234 810 000 0000',
  amount: 7500,
  serviceFee: 750,
  total: 8250,
  status: 'confirmed',
  terminal: 'ABC Transport Terminal, Jibowu, Lagos',
}

export default function BookingDetailPage() {
  const router = useRouter()

  const handlePrint = () => window.print()

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Back */}
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 13, marginBottom: 20, fontWeight: 500 }}>
          <ArrowLeft size={16} /> Back to Bookings
        </button>

        {/* Ticket Card */}
        <div className="mt-card" style={{ overflow: 'hidden' }} id="ticket">

          {/* Green header */}
          <div style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', padding: '20px 24px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <CheckCircle2 size={18} />
                  <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.9 }}>Booking Confirmed</span>
                </div>
                <p style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                  {mockBooking.from} → {mockBooking.to}
                </p>
                <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{mockBooking.departureDate}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Booking ID</p>
                <p style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>#{mockBooking.id}</p>
              </div>
            </div>
          </div>

          {/* Ticket body */}
          <div style={{ padding: '20px 24px' }}>

            {/* Time row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{mockBooking.departureTime}</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>{mockBooking.from}</p>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, margin: '0 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94A3B8', fontSize: 11 }}>
                  <Clock size={12} /> ~6h 30m
                </div>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 4 }}>
                  <div style={{ height: 1.5, flex: 1, background: '#E2E8F0' }} />
                  <ArrowRight size={14} color="#94A3B8" />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>{mockBooking.arrivalTime}</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>{mockBooking.to}</p>
              </div>
            </div>

            {/* Dashed divider */}
            <div style={{ borderTop: '2px dashed #E2E8F0', margin: '0 -24px 20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -10, left: -10, width: 20, height: 20, background: '#F8FAFC', borderRadius: '50%', border: '1px solid #E2E8F0' }} />
              <div style={{ position: 'absolute', top: -10, right: -10, width: 20, height: 20, background: '#F8FAFC', borderRadius: '50%', border: '1px solid #E2E8F0' }} />
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Passenger', value: mockBooking.passenger, icon: User },
                { label: 'Seat Number', value: mockBooking.seat, icon: Bus },
                { label: 'Class', value: mockBooking.class, icon: null },
                { label: 'Company', value: mockBooking.company, icon: null },
                { label: 'Terminal', value: mockBooking.terminal, icon: MapPin, full: true },
              ].map(item => (
                <div key={item.label} style={{ gridColumn: item.full ? '1 / -1' : undefined }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{item.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Price */}
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 4 }}>
                <span>Ticket price</span><span>₦{mockBooking.amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                <span>Service fee</span><span>₦{mockBooking.serviceFee.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#0F172A', borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                <span>Total Paid</span><span style={{ color: '#16A34A' }}>₦{mockBooking.total.toLocaleString()}</span>
              </div>
            </div>

            {/* QR Code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 20 }}>
              <QRCode value={mockBooking.qrValue} size={140} level="H" />
              <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10, textAlign: 'center' }}>
                Scan this QR code at the terminal for check-in
              </p>
              <p style={{ fontSize: 10, color: '#CBD5E1', fontFamily: 'monospace', marginTop: 4, letterSpacing: 2 }}>
                {mockBooking.qrValue}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }} className="no-print">
          <button onClick={handlePrint} className="mt-btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            <Download size={15} /> Download PDF
          </button>
          <button className="mt-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            <Share2 size={15} /> Share Ticket
          </button>
        </div>

        {/* Cancel option for confirmed */}
        <div style={{ marginTop: 14, textAlign: 'center' }} className="no-print">
          <button style={{ background: 'none', border: 'none', fontSize: 13, color: '#DC2626', cursor: 'pointer', fontWeight: 500 }}>
            Request Cancellation
          </button>
        </div>

      </div>
    </div>
  )
}
