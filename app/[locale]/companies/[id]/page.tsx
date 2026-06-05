'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, MapPin, Star, Phone, Mail, Navigation, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

type CompanyDetails = {
  id: string
  name: string
  status: string
  logo_url: string | null
  email: string
  phone: string
  address: string
  city: string
  state: string
}

export default function CompanyProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<CompanyDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCompanyProfile() {
      if (!id) return

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setCompany(data)
      }
      setLoading(false)
    }

    fetchCompanyProfile()
  }, [id])

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>Loading profile...</div>
  }

  if (!company) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div className="mt-card" style={{ padding: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Company Not Found</h2>
          <button onClick={() => router.back()} className="mt-btn-primary">Go Back</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      
      {/* Cover Banner */}
      <div style={{ height: 240, background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)', position: 'relative' }}>
        <button onClick={() => router.back()} style={{ position: 'absolute', top: 24, left: 24, background: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', paddingBottom: 60, marginTop: -60, position: 'relative' }}>
        
        {/* Profile Header Card */}
        <div className="mt-card" style={{ padding: 32, marginBottom: 32, display: 'flex', gap: 32, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ width: 120, height: 120, background: '#FFF', borderRadius: 16, border: '4px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            {company.logo_url ? (
              <Image src={company.logo_url} alt={company.name} width={120} height={120} style={{ objectFit: 'cover' }} />
            ) : (
              <Building2 size={48} color="#94A3B8" />
            )}
          </div>
          
          <div style={{ flex: 1, minWidth: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>{company.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: company.status === 'verified' ? '#16A34A' : '#F59E0B', background: company.status === 'verified' ? '#ECFDF5' : '#FEF3C7', padding: '4px 10px', borderRadius: 20 }}>
                    {company.status === 'verified' ? '✓ Verified Partner' : 'Pending Verification'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={16} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ fontWeight: 600, color: '#475569' }}>4.8 Rating</span>
                  </div>
                </div>
              </div>

              <Link href={`/en/search?company=${company.id}`} className="mt-btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Navigation size={18} /> View Routes
              </Link>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          
          {/* Contact Details */}
          <div className="mt-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>Contact Information</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Head Office</p>
                  <p style={{ fontWeight: 600, color: '#0F172A' }}>{company.address || 'Address not provided'}</p>
                  <p style={{ fontSize: 13, color: '#64748B' }}>{company.city && company.state ? `${company.city}, ${company.state}` : ''}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                  <Phone size={20} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Phone Number</p>
                  <p style={{ fontWeight: 600, color: '#0F172A' }}>{company.phone || 'Not provided'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <p style={{ fontSize: 13, color: '#64748B' }}>Email Address</p>
                  <p style={{ fontWeight: 600, color: '#0F172A' }}>{company.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mt-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>About {company.name}</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>
              {company.name} is a registered transport company on the RoutePro platform. 
              {company.status === 'verified' 
                ? ' They have completed all necessary documentation, including CAC verification and vehicle inspections, ensuring a safe and reliable travel experience.'
                : ' They are currently undergoing the strict verification process to ensure safety and compliance.'}
            </p>
            <div style={{ marginTop: 24, padding: 16, background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginBottom: 8 }}>Safety First Policy</h4>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
                All verified companies must maintain up-to-date insurance and roadworthiness certificates for their entire fleet.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
