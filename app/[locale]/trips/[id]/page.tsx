'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Clock, Users, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface TripDetails {
  id: string
  departure_at: string
  arrival_at: string
  base_price: number
  currency: string
  route: {
    origin: string
    destination: string
  }
  company: {
    name: string
  }
  vehicle: {
    capacity: number
    name: string
  }
}

interface SeatStatus {
  id: string
  row: string
  col: number
  status: 'available' | 'booked' | 'reserved'
}

const legendItems = [
  { label: 'Available',  cls: 'seat-available' },
  { label: 'Selected',   cls: 'seat-selected' },
  { label: 'Booked',     cls: 'seat-booked' },
  { label: 'Reserved',   cls: 'seat-reserved' },
]

export default function TripDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const tripId = params.id as string

  const [trip, setTrip] = useState<TripDetails | null>(null)
  const [seats, setSeats] = useState<SeatStatus[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTripAndSeats = async () => {
    setLoading(true)
    try {
      // Fetch trip details
      const { data: tripData, error: tripErr } = await supabase
        .from('trips')
        .select(`
          id,
          departure_at,
          arrival_at,
          base_price,
          currency,
          route:route_id (origin, destination),
          company:company_id (name),
          vehicle:vehicle_id (name, capacity)
        `)
        .eq('id', tripId)
        .single()

      if (tripErr || !tripData) {
        // Fallback for demo routes if URL ID matches demo-1 or demo-2
        if (tripId.startsWith('demo')) {
          setTrip({
            id: tripId,
            departure_at: new Date().toISOString(),
            arrival_at: new Date(Date.now() + 6.5 * 3600000).toISOString(),
            base_price: tripId === 'demo-1' ? 17500 : 18000,
            currency: 'NGN',
            route: {
              origin: searchParams.get('from') || 'Lagos',
              destination: searchParams.get('to') || 'Abuja'
            },
            company: { name: tripId === 'demo-1' ? 'ABC Transport' : 'God is Good Motors' },
            vehicle: { name: 'Toyota HiAce', capacity: 14 }
          })
          generateSeats(14, [])
          setLoading(false)
          return
        }
        throw new Error('Trip details could not be found.')
      }

      // Fetch booked seats for this trip
      const { data: bookedData, error: bookedErr } = await supabase
        .from('booking_passengers')
        .select(`
          seat_id,
          ticket_status,
          booking:booking_id!inner (trip_id)
        `)
        .eq('booking.trip_id', tripId)

      const bookedSeatNumbers = (bookedData || []).map(b => b.seat_id)

      // Supabase joins may return arrays; safely extract the first element
      const companyData = Array.isArray(tripData.company) ? tripData.company[0] : tripData.company
      const routeData = Array.isArray(tripData.route) ? tripData.route[0] : tripData.route
      const vehicleData = Array.isArray(tripData.vehicle) ? tripData.vehicle[0] : tripData.vehicle

      const normalizedTrip: TripDetails = {
        id: tripData.id,
        departure_at: tripData.departure_at,
        arrival_at: tripData.arrival_at,
        base_price: tripData.base_price,
        currency: tripData.currency,
        route: {
          origin: routeData?.origin || searchParams.get('from') || 'Origin',
          destination: routeData?.destination || searchParams.get('to') || 'Destination',
        },
        company: {
          name: companyData?.name || 'Transport Provider',
        },
        vehicle: {
          name: vehicleData?.name || 'Vehicle',
          capacity: vehicleData?.capacity || 14,
        },
      }

      setTrip(normalizedTrip)
      generateSeats(normalizedTrip.vehicle.capacity, bookedSeatNumbers)
    } catch (err) {
      console.error('Error loading seat map:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateSeats = (capacity: number, bookedSeats: string[]) => {
    const generated: SeatStatus[] = []
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
    const colsPerRow = 4

    let seatCount = 0
    for (let r = 0; r < rows.length; r++) {
      if (seatCount >= capacity) break
      for (let c = 1; c <= colsPerRow; c++) {
        if (seatCount >= capacity) break
        const seatId = `${rows[r]}${c}`
        generated.push({
          id: seatId,
          row: rows[r],
          col: c,
          status: bookedSeats.includes(seatId) ? 'booked' : 'available'
        })
        seatCount++
      }
    }
    setSeats(generated)
  }

  useEffect(() => {
    fetchTripAndSeats()
  }, [tripId])

  const toggleSeat = (seatId: string, status: string) => {
    if (status === 'booked' || status === 'reserved') return
    setSelected(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    )
  }

  const rows = Array.from(new Set(seats.map(s => s.row)))
  const basePrice = trip?.base_price || 0
  const total = selected.length * basePrice

  const handleContinue = () => {
    if (selected.length === 0 || !trip) return
    const seatParam = selected.join(',')
    router.push(`/en/trips/${tripId}/book?seats=${seatParam}&price=${basePrice}`)
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading seat layout...</div>
  }

  if (!trip) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#DC2626' }}>Trip not found.</div>
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '12px 20px', position: 'sticky', top: 64, zIndex: 30 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Select Seats</h1>
            <p style={{ fontSize: 12, color: '#94A3B8' }}>
              {trip.company?.name} · {new Date(trip.departure_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 20px 120px' }}>

        {/* Trip Summary Card */}
        <div className="mt-card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 700 }}>
              {trip.company?.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{trip.company?.name}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                  {new Date(trip.departure_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{trip.route?.origin}</span>
                <ArrowRight size={12} color="#94A3B8" />
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{trip.route?.destination}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#16A34A' }}>
                {trip.currency === 'NGN' ? '₦' : '$'}{basePrice.toLocaleString()}
              </p>
              <p style={{ fontSize: 11, color: '#94A3B8' }}>per seat</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {legendItems.map(({ label, cls }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className={`seat ${cls}`} style={{ width: 18, height: 18, borderRadius: 4, cursor: 'default' }} />
              <span style={{ fontSize: 11, color: '#64748B' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Seat Map */}
        <div className="mt-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <div style={{ background: '#F1F5F9', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}>
              🚗 Driver
            </div>
          </div>

          {/* Seat grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(row => {
              const rowSeats = seats.filter(s => s.row === row)
              return (
                <div key={row} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 16px 1fr 1fr', gap: 6, alignItems: 'center' }}>
                  {rowSeats.slice(0, 2).map(seat => {
                    const isSelected = selected.includes(seat.id)
                    const cls = isSelected ? 'seat-selected' : `seat-${seat.status}`
                    return (
                      <button
                        key={seat.id}
                        className={`seat ${cls}`}
                        onClick={() => toggleSeat(seat.id, seat.status)}
                        disabled={seat.status === 'booked' || seat.status === 'reserved'}
                        title={seat.id}
                      >
                        {seat.id}
                      </button>
                    )
                  })}
                  {/* Aisle */}
                  <div />
                  {rowSeats.slice(2).map(seat => {
                    const isSelected = selected.includes(seat.id)
                    const cls = isSelected ? 'seat-selected' : `seat-${seat.status}`
                    return (
                      <button
                        key={seat.id}
                        className={`seat ${cls}`}
                        onClick={() => toggleSeat(seat.id, seat.status)}
                        disabled={seat.status === 'booked' || seat.status === 'reserved'}
                        title={seat.id}
                      >
                        {seat.id}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0,
        background: '#FFFFFF', borderTop: '1px solid #E2E8F0',
        padding: '12px 20px', zIndex: 40,
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, color: '#94A3B8' }}>
              Selected Seats ({selected.length}): <strong style={{ color: '#0F172A' }}>{selected.join(', ') || '—'}</strong>
            </p>
            {selected.length > 0 && (
              <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>
                {trip.currency === 'NGN' ? '₦' : '$'}{total.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={handleContinue}
            disabled={selected.length === 0}
            className="mt-btn-primary"
            style={{ opacity: selected.length === 0 ? 0.4 : 1 }}
          >
            Continue to Passenger Details
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
