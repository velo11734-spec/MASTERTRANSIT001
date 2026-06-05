'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bus, MapPin, CalendarDays, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Route {
  id: string
  origin: string
  destination: string
}

interface Vehicle {
  id: string
  name: string
  plate_number: string
}

export default function NewTripPage() {
  const router = useRouter()
  const [routes, setRoutes] = useState<Route[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [scheduling, setScheduling] = useState(false)
  const [isVerified, setIsVerified] = useState(true)

  // Form state
  const [routeId, setRouteId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [departureAt, setDepartureAt] = useState('')
  const [arrivalAt, setArrivalAt] = useState('')
  const [basePrice, setBasePrice] = useState('')

  const fetchOptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: company } = await supabase
        .from('companies')
        .select('id, status')
        .eq('owner_id', user.id)
        .single()

      if (!company) return
      
      if (company.status !== 'verified') {
        setIsVerified(false)
      }

      if (!company) return

      const [routesRes, vehiclesRes] = await Promise.all([
        supabase.from('routes').select('id, origin, destination').eq('company_id', company.id),
        supabase.from('vehicles').select('id, name, plate_number').eq('company_id', company.id).eq('is_active', true)
      ])

      setRoutes(routesRes.data || [])
      setVehicles(vehiclesRes.data || [])
    } catch (err) {
      console.error('Error fetching options:', err)
    } finally {
      setLoadingOptions(false)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!routeId || !vehicleId || !departureAt || !arrivalAt || !basePrice) {
      alert('Please fill out all fields')
      return
    }

    setScheduling(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: company } = await supabase
        .from('companies')
        .select('id, name, city, state, address')
        .eq('owner_id', user.id)
        .single()

      if (!company) throw new Error('Company details not found.')

      // Check if a terminal exists for the company, create default if not
      let terminalId = null
      const { data: terminals } = await supabase
        .from('terminals')
        .select('id')
        .eq('company_id', company.id)
        .limit(1)

      if (terminals && terminals.length > 0) {
        terminalId = terminals[0].id
      } else {
        // Create default terminal
        const { data: newTerminal, error: termErr } = await supabase
          .from('terminals')
          .insert({
            company_id: company.id,
            name: `${company.name} Main Terminal`,
            city: company.city || 'Lagos',
            state: company.state || 'Lagos',
            address: company.address || 'Central Bus Station',
            is_active: true
          })
          .select('id')
          .single()

        if (termErr) throw termErr
        terminalId = newTerminal.id
      }

      // Schedule the trip
      const { error: dbError } = await supabase.from('trips').insert({
        company_id: company.id,
        route_id: routeId,
        vehicle_id: vehicleId,
        terminal_id: terminalId,
        departure_at: new Date(departureAt).toISOString(),
        arrival_at: new Date(arrivalAt).toISOString(),
        base_price: parseFloat(basePrice),
        currency: 'NGN',
        status: 'SCHEDULED'
      })

      if (dbError) throw dbError

      alert('Trip scheduled successfully!')
      router.push('/en/company/trips')
    } catch (err: any) {
      console.error('Error scheduling trip:', err)
      alert(err.message || 'Failed to schedule trip.')
    } finally {
      setScheduling(false)
    }
  }

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        
        {/* Back Link */}
        <Link href="/en/company/trips" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', textDecoration: 'none', marginBottom: 20, fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Trips List
        </Link>

        {/* Form Card */}
        <div className="mt-card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Schedule New Trip</h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Define departures, fares and vehicles for passengers to book</p>
          </div>

          {loadingOptions ? (
            <p style={{ color: '#64748B' }}>Loading routes and vehicles options...</p>
          ) : !isVerified ? (
            <div style={{ padding: 24, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>Account Verification Pending</h3>
              <p style={{ color: '#B91C1C', fontSize: 14 }}>
                You must complete the verification process and be approved by an Admin before you can schedule trips or sell tickets.
              </p>
              <Link href="/en/company/verify-payment" className="mt-btn-primary" style={{ display: 'inline-block', marginTop: 16, textDecoration: 'none' }}>
                Complete Verification
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <label className="mt-label">Select Travel Route</label>
                <select 
                  value={routeId} 
                  onChange={e => setRouteId(e.target.value)} 
                  required 
                  className="mt-input"
                >
                  <option value="">-- Select Route --</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.origin} to {r.destination}</option>
                  ))}
                </select>
                {routes.length === 0 && (
                  <p style={{ fontSize: 11, color: '#EA580C', marginTop: 4 }}>
                    No routes found. Please <Link href="/en/company/routes" style={{ color: '#2563EB', fontWeight: 600 }}>create a route</Link> first.
                  </p>
                )}
              </div>

              <div>
                <label className="mt-label">Assign Fleet Vehicle</label>
                <select 
                  value={vehicleId} 
                  onChange={e => setVehicleId(e.target.value)} 
                  required 
                  className="mt-input"
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.plate_number})</option>
                  ))}
                </select>
                {vehicles.length === 0 && (
                  <p style={{ fontSize: 11, color: '#EA580C', marginTop: 4 }}>
                    No vehicles found. Please <Link href="/en/company/fleet" style={{ color: '#2563EB', fontWeight: 600 }}>add a vehicle</Link> to your fleet first.
                  </p>
                )}
              </div>

              <div>
                <label className="mt-label">Departure Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={departureAt} 
                  onChange={e => setDepartureAt(e.target.value)} 
                  required 
                  className="mt-input" 
                />
              </div>

              <div>
                <label className="mt-label">Estimated Arrival Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={arrivalAt} 
                  onChange={e => setArrivalAt(e.target.value)} 
                  required 
                  className="mt-input" 
                />
              </div>

              <div>
                <label className="mt-label">Base Price / Ticket Fare (₦)</label>
                <input 
                  type="number" 
                  min={1} 
                  placeholder="e.g. 15000"
                  value={basePrice} 
                  onChange={e => setBasePrice(e.target.value)} 
                  required 
                  className="mt-input" 
                />
              </div>

              <button 
                type="submit" 
                disabled={scheduling || routes.length === 0 || vehicles.length === 0} 
                className="mt-btn-primary" 
                style={{ width: '100%', padding: '12px', marginTop: 6 }}
              >
                {scheduling ? 'Scheduling Trip...' : 'Schedule Trip'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
