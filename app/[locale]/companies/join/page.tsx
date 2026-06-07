'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  CheckCircle,
  Clock,
  ShieldCheck,
  TrendingUp,
  FileText,
  Lock,
  ArrowRight,
  Upload,
  UserCheck,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function CompanyJoinPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Form sections tracking
  const [formData, setFormData] = useState({
    name: '',
    cac_number: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    business_type: 'Transport Operator',
    business_roles: [] as string[],
    // Bank details
    bank_name: '',
    account_number: '',
    account_name: '',
    agree_terms: false
  })

  const [cacFile, setCacFile] = useState<File | null>(null)
  const [licFile, setLicFile] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleCheckboxChange = (role: string) => {
    setFormData(prev => {
      const current = [...prev.business_roles]
      if (current.includes(role)) {
        return { ...prev, business_roles: current.filter(r => r !== role) }
      } else {
        return { ...prev, business_roles: [...current, role] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError(null)
    setSubmitting(true)

    if (formData.business_roles.length === 0) {
      setError('Please select at least one Business Role / Category.')
      setSubmitting(false)
      return
    }

    if (!formData.agree_terms) {
      setError('You must accept the terms and conditions to register.')
      setSubmitting(false)
      return
    }

    try {
      // Create/insert company record
      const { data, error: insertErr } = await supabase
        .from('companies')
        .insert({
          name: formData.name,
          cac_number: formData.cac_number,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          owner_id: user.id,
          status: 'PENDING',
          business_roles: formData.business_roles,
          dashboard_enabled: false
        })
        .select()
        .single()

      if (insertErr) throw insertErr

      // Upload documents if provided
      try {
        if (cacFile) {
          await supabase.storage.from('company-documents').upload(`${data.id}/cac_${Date.now()}_${cacFile.name}`, cacFile)
        }
        if (licFile) {
          await supabase.storage.from('company-documents').upload(`${data.id}/license_${Date.now()}_${licFile.name}`, licFile)
        }
      } catch (uploadErr) {
        console.error('Document upload error (ignoring non-blocking):', uploadErr)
      }

      // Add to company bank details if possible
      try {
        await supabase.from('company_bank_details').insert({
          company_id: data.id,
          bank_name: formData.bank_name,
          account_number: formData.account_number,
          account_name: formData.account_name
        })
      } catch (bankErr) {
        console.error('Failed to insert bank details (ignoring non-blocking):', bankErr)
      }

      // Add to audit logs
      try {
        await supabase.from('audit_logs').insert({
          actor_id: user.id,
          actor_email: user.email,
          action: 'company_application_submit',
          entity_type: 'company',
          entity_id: data.id,
          new_value: { name: formData.name, roles: formData.business_roles }
        })
      } catch (logErr) {
        console.error('Failed to log audit (ignoring non-blocking):', logErr)
      }

      // Create initial wallet for company
      try {
        await supabase.from('company_wallets').insert({
          company_id: data.id,
          balance: 0,
          ledger_balance: 0
        })
      } catch (walletErr) {
        console.error('Failed to initialize company wallet:', walletErr)
      }

      router.push('/en/companies/application-status')
    } catch (err: any) {
      console.error('Company registration error:', err)
      setError(err.message || 'An error occurred during registration. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const businessRolesList = [
    { key: 'Transport Operator', label: 'Transport Operator', desc: 'Sell tickets for Bus, Boat, Train or Shuttle travel.' },
    { key: 'Vehicle Dealer', label: 'Vehicle Dealer', desc: 'List and sell vehicles on the Marketplace.' },
    { key: 'Rental Provider', label: 'Rental Provider', desc: 'Rent vehicles out to individuals or businesses.' },
    { key: 'Fleet Provider', label: 'Fleet Provider', desc: 'Manage fleets and outsource vehicles to transport companies.' },
    { key: 'Corporate Mobility', label: 'Corporate Mobility', desc: 'Offer customized shuttle and transit contracts to corporates.' }
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 64, fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }} className="fade-in">
          <span style={{ color: '#16A34A', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>RoutePro Partner Network</span>
          <h1 style={{ fontSize: 36, fontWeight: 950, marginTop: 8, marginBottom: 16, fontFamily: 'Outfit, sans-serif' }}>Grow Your Mobility Business With RoutePro</h1>
          <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Onboard your company to gain access to millions of passengers, listing marketplaces, robust fleet tools, and our enterprise payouts system.
          </p>
        </div>
      </section>

      {/* Grid of partner categories */}
      <section style={{ maxWidth: 800, margin: '-32px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { title: 'Transport Operators', desc: 'Publish schedules, manage seat reservations, track trips and capture ticket sales online.' },
            { title: 'Vehicle Dealers', desc: 'Market brand new or certified pre-owned vehicles on Nigeria\'s leading vehicle registry.' },
            { title: 'Rental Providers', desc: 'Onboard cars, coaches, buses or boats for hourly, daily, or customized lease.' },
          ].map(c => (
            <div key={c.title} className="mt-card card-hover" style={{ padding: 20, background: '#FFFFFF', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 750, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={16} color="#16A34A" /> {c.title}
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Join */}
      <section style={{ maxWidth: 800, margin: '48px auto 0', padding: '0 24px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 20, textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>Why Partner With RoutePro?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
          {[
            { icon: TrendingUp, title: 'Expand Market Reach', desc: 'Tap into our nationwide database of active daily commuters.' },
            { icon: Clock, title: 'Fast Automated Payouts', desc: 'Select automated or custom payout runs directly to your verified bank account.' },
            { icon: ShieldCheck, title: 'Compliance & Verification', desc: 'Rest easier with verified passengers, secured escrow deposits, and real-time tracking.' },
            { icon: Lock, title: 'Role-Based Dashboards', desc: 'Access highly specialized fleet, route, inventory, and analytics tools built for your teams.' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ width: 40, height: 40, background: '#DCFCE7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A', flexShrink: 0 }}>
                <item.icon size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{item.title}</h4>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form or Auth Gate */}
      <section id="register-section" style={{ maxWidth: 680, margin: '48px auto 0', padding: '0 20px' }}>
        {authLoading ? (
          <div className="mt-card" style={{ padding: 40, background: '#FFFFFF', textAlign: 'center' }}>
            <div className="skeleton" style={{ height: 24, width: '60%', margin: '0 auto 16px' }} />
            <div className="skeleton" style={{ height: 16, width: '40%', margin: '0 auto 24px' }} />
            <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
          </div>
        ) : !user ? (
          <div className="mt-card text-center" style={{ padding: 40, background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <AlertCircle size={48} color="#F59E0B" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>Identity Required</h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: 1.6 }}>
              You need to be logged in to RoutePro to submit a business onboarding application. This binds your business profile securely to your user credentials.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link href="/en/login?redirect=/en/companies/join" className="mt-btn-primary btn-press" style={{ textDecoration: 'none' }}>
                Sign In to Account
              </Link>
              <Link href="/en/register?redirect=/en/companies/join" className="mt-btn-outline btn-press" style={{ textDecoration: 'none' }}>
                Register Profile
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-card fade-in" style={{ padding: 32, background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 4, fontFamily: 'Outfit, sans-serif' }}>Partner Application Form</h3>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 24 }}>Logged in as: <strong style={{ color: '#0F172A' }}>{user.email}</strong></p>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: 12, borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Section 1: Business Details */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. Company Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="mt-label">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    className="mt-input"
                    placeholder="e.g. ABC Motors Ltd"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mt-label">CAC Registration No. *</label>
                  <input
                    type="text"
                    required
                    className="mt-input"
                    placeholder="e.g. RC-1234567"
                    value={formData.cac_number}
                    onChange={e => setFormData(prev => ({ ...prev, cac_number: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="mt-label">Official Phone *</label>
                  <input
                    type="tel"
                    required
                    className="mt-input"
                    placeholder="+234-800-000-0000"
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mt-label">Street Address *</label>
                  <input
                    type="text"
                    required
                    className="mt-input"
                    placeholder="Head office location"
                    value={formData.address}
                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label className="mt-label">City *</label>
                  <input
                    type="text"
                    required
                    className="mt-input"
                    placeholder="e.g. Ikeja"
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mt-label">State *</label>
                  <input
                    type="text"
                    required
                    className="mt-input"
                    placeholder="e.g. Lagos"
                    value={formData.state}
                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Business Role selection */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>2. Business Roles & Categories *</h4>
              <p style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>Select all operational sectors your company handles (influences your dashboard modules):</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {businessRolesList.map(r => (
                  <label key={r.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#F8FAFC', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      style={{ marginTop: 3 }}
                      checked={formData.business_roles.includes(r.key)}
                      onChange={() => handleCheckboxChange(r.key)}
                    />
                    <div>
                      <strong style={{ fontSize: 13, color: '#0F172A', display: 'block' }}>{r.label}</strong>
                      <span style={{ fontSize: 11, color: '#64748B' }}>{r.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Section 3: Bank Details */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>3. Payout Settlement Account</h4>
              <p style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>Your ticket sales, rentals, or listings payout funds will settle to this account.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="mt-label">Bank Name *</label>
                  <input
                    type="text"
                    required
                    className="mt-input"
                    placeholder="e.g. Zenith Bank"
                    value={formData.bank_name}
                    onChange={e => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mt-label">Account Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    className="mt-input"
                    placeholder="10-digit NUBAN"
                    value={formData.account_number}
                    onChange={e => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="mt-label">Account Beneficiary Name *</label>
                <input
                  type="text"
                  required
                  className="mt-input"
                  placeholder="Should match legal company name or DBA"
                  value={formData.account_name}
                  onChange={e => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                />
              </div>
            </div>

            {/* Section 4: Document Upload placeholders */}
            <div style={{ marginBottom: 28 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>4. Verification Documents</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ border: '1px dashed #CBD5E1', padding: 16, borderRadius: 8, background: '#F8FAFC', textAlign: 'center' }}>
                  <Upload size={20} color="#64748B" style={{ margin: '0 auto 8px' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, display: 'block', color: '#0F172A' }}>CAC Certificate *</span>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>PDF, JPG, PNG (Max 5MB)</span>
                  {cacFile && <span style={{ fontSize: 11, color: '#16A34A', display: 'block', marginTop: 4 }}>{cacFile.name}</span>}
                  <input type="file" style={{ display: 'none' }} id="cac-file" onChange={e => e.target.files && setCacFile(e.target.files[0])} />
                  <button type="button" onClick={() => document.getElementById('cac-file')?.click()} className="mt-btn-outline" style={{ padding: '4px 10px', fontSize: 11, marginTop: 8, height: 'auto' }}>
                    Select File
                  </button>
                </div>
                <div style={{ border: '1px dashed #CBD5E1', padding: 16, borderRadius: 8, background: '#F8FAFC', textAlign: 'center' }}>
                  <Upload size={20} color="#64748B" style={{ margin: '0 auto 8px' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, display: 'block', color: '#0F172A' }}>Operating License / ID *</span>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>PDF, JPG, PNG (Max 5MB)</span>
                  {licFile && <span style={{ fontSize: 11, color: '#16A34A', display: 'block', marginTop: 4 }}>{licFile.name}</span>}
                  <input type="file" style={{ display: 'none' }} id="lic-file" onChange={e => e.target.files && setLicFile(e.target.files[0])} />
                  <button type="button" onClick={() => document.getElementById('lic-file')?.click()} className="mt-btn-outline" style={{ padding: '4px 10px', fontSize: 11, marginTop: 8, height: 'auto' }}>
                    Select File
                  </button>
                </div>
              </div>
            </div>

            {/* Declarations */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ marginTop: 3 }}
                  required
                  checked={formData.agree_terms}
                  onChange={e => setFormData(prev => ({ ...prev, agree_terms: e.target.checked }))}
                />
                <span style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
                  I declare that all details and documents uploaded here are authentic. I agree to RoutePro\'s{' '}
                  <Link href="/en/legal/transport-partner-agreement" style={{ color: '#16A34A', fontWeight: 600 }}>
                    Transport Partner Agreement
                  </Link>{' '}
                  and compliance terms.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-btn-primary btn-press text-center"
              style={{ width: '100%', padding: '14px', borderRadius: 8, display: 'block', fontSize: 14, fontWeight: 700 }}
            >
              {submitting ? 'Submitting Application...' : 'Submit Business Application'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
