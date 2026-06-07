'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Calendar, AlertCircle } from 'lucide-react'

export default function RentalsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }} className="fade-in">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Rental Provider Hub</h1>
        <p style={{ fontSize: 13, color: '#64748B' }}>Onboard lease inventory, track escrow security deposits, and process hire reservations</p>
      </div>

      <div className="mt-card text-center" style={{ padding: 40, background: '#FFFFFF', borderRadius: 12 }}>
        <Calendar size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: '#64748B' }}>Rental fleet systems are active. Onboard vehicles into the fleet registry with type "Sedan" or "Coach" to list them for rent.</p>
      </div>
    </div>
  )
}
