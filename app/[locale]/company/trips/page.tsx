'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bus, MapPin, CalendarDays, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Trip {
  id: string
  route: {
    origin: string
    destination: string
  }
  vehicle: {
    name: string
    plate_number: string
  }
  departure_at: string
  arrival_at: string
  base_price: number
  status: string
}

export default function TripsListPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTrips = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!company) return

      const { data: tripData, error } = await supabase
        .from('trips')
        .select(`
          id,
          departure_at,
          arrival_at,
          base_price,
          status,
          route:route_id (origin, destination),
          vehicle:vehicle_id (name, plate_number)
        `)
        .eq('company_id', company.id)
        .order('departure_at', { ascending: true })

      if (error) throw error
      setTrips((tripData || []) as any)
    } catch (err) {
      console.error('Error fetching trips:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Scheduled Trips</h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>View and manage travel itineraries and schedules</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/en/company/trips/new" className="mt-btn-primary">
              <Plus size={16} /> Create Trip
            </Link>
            <button onClick={() => router.push('/en/company/dashboard')} className="mt-btn-outline" style={{ padding: '10px 20px' }}>
              Dashboard
            </button>
          </div>
        </div>

        {/* Trips Table/List */}
        <div className="mt-card" style={{ padding: 24 }}>
          {loading ? (
            <p style={{ color: '#64748B' }}>Loading scheduled trips...</p>
          ) : trips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <CalendarDays size={36} style={{ color: '#94A3B8', marginBottom: 12, margin: '0 auto' }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No scheduled trips found</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Get started by scheduling your first trip.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Route</th>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Vehicle Info</th>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Schedule Details</th>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Fare</th>
                  <th style={{ padding: '0 0 12px 0', fontSize: 12, color: '#64748B', fontWeight: 600, textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 0' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        {trip.route?.origin} → {trip.route?.destination}
                      </p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>{trip.id}</p>
                    </td>
                    <td style={{ padding: '16px 0' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{trip.vehicle?.name}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8' }}>{trip.vehicle?.plate_number}</p>
                    </td>
                    <td style={{ padding: '16px 0', fontSize: 13, color: '#374151' }}>
                      {new Date(trip.departure_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '16px 0', fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                      ₦{trip.base_price.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999,
                        background: trip.status === 'SCHEDULED' ? '#DCFCE7' : '#FEF9C3',
                        color: trip.status === 'SCHEDULED' ? '#15803D' : '#854D0E'
                      }}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}
