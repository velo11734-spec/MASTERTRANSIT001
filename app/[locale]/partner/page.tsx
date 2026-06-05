'use client'

import { useState } from 'react'
import {
  Building2,
  Handshake,
  TrendingUp,
  Settings,
  Users,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  ChevronUp,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function PartnerPage() {
  const [formData, setFormData] = useState({
    orgName: '',
    orgType: 'Luxury Coach',
    contactPerson: '',
    email: '',
    phone: '',
    country: 'Nigeria',
    partnershipCategory: 'Transport Operators',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!formData.orgName || !formData.contactPerson || !formData.email) {
        throw new Error('Organization name, contact person, and email are required.')
      }

      const { error: insertErr } = await supabase
        .from('partner_applications')
        .insert({
          org_name: formData.orgName,
          org_type: formData.orgType,
          contact_person: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          partnership_category: formData.partnershipCategory,
          description: formData.description,
          status: 'pending'
        })

      if (insertErr) throw insertErr
      setSuccess(true)
      setFormData({
        orgName: '',
        orgType: 'Luxury Coach',
        contactPerson: '',
        email: '',
        phone: '',
        country: 'Nigeria',
        partnershipCategory: 'Transport Operators',
        description: ''
      })
    } catch (err: any) {
      console.error('Submit application error:', err)
      setError(err.message || 'Failed to submit application.')
    } finally {
      setLoading(false)
    }
  }

  const scrollForm = () => {
    const el = document.getElementById('application-form')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const partnershipTypes = [
    {
      title: 'Transport Operators',
      desc: 'Bus operators, Luxury coach managers, local ferry links, rail systems and corporate shuttles looking to list routes.',
      bullets: ['Luxury Coach Operators', 'Inter-city Bus Fleets', 'Local Ferry Links', 'Airport Shuttles', 'Corporate Transit Providers']
    },
    {
      title: 'Technology Partners',
      desc: 'Integrate API credentials for ticketing gateways, security authentication, mapping services, telemetry, and payment tools.',
      bullets: ['Payment Solutions Providers', 'Geo-Mapping & Route Planners', 'Vehicle Telematics systems', 'Identity Verification tools', 'Loyalty Program systems']
    },
    {
      title: 'Commercial Partners',
      desc: 'Hotels, travel agencies, event portals, corporate HR offices, and public universities looking for custom booking portals.',
      bullets: ['Event Ticket Platforms', 'Hotel Concierge Desks', 'Corporate Travel Portals', 'State Tourism Boards', 'University Student Portals']
    },
    {
      title: 'Marketing Partners',
      desc: 'Content creators, media publishers, travel communities, and travel agencies aiming to promote multi-modal travel.',
      bullets: ['Affiliate Marketers', 'Travel Vloggers & Bloggers', 'Tourism Associations', 'Brand Sponsors', 'Outdoor Advertising agencies']
    }
  ]

  const benefits = [
    { title: 'Access Millions of Travelers', desc: 'Onboard your schedules to instantly display to passengers checking cross-country routes.', icon: Users },
    { title: 'Digital Booking Suite', desc: 'Equip ticketing managers with a unified backoffice containing automated seat inventory controls.', icon: Settings },
    { title: 'Insightful Fleet Analytics', desc: 'Analyze real-time demand indexes, ticket revenue cycles, empty-run ratios, and client reviews.', icon: TrendingUp },
    { title: 'Instant Online Payouts', desc: 'Enjoy reliable payout intervals directly to local corporate bank accounts with transparent ledger logs.', icon: Handshake },
    { title: 'Dynamic Booking Freeze Controls', desc: 'Secure operational controls during emergencies with real-time route cancellation broadcasts.', icon: ShieldCheck },
    { title: 'Nigeria-wide Hub Integration', desc: 'Synchronize route schedules with major terminals in Lagos, Abuja, Port Harcourt, and Ibadan.', icon: MapPin }
  ]

  const workflow = [
    { step: '1', title: 'Submit Proposal', desc: 'Fill out the digital application form detailing your organization, fleet sizes, and partnership objectives.' },
    { step: '2', title: 'Initial Evaluation', desc: 'Our onboarding team reviews compliance documents, licenses, and CAC registration status.' },
    { step: '3', title: 'Onboarding Demo', desc: 'Get a hands-on walkthrough of the super-admin console, payouts dashboard, and seat configurators.' },
    { step: '4', title: 'Launch Route Schedulers', desc: 'Configure pickup hubs, assign vehicles, establish pricing levels, and publish your first tickets live.' }
  ]

  const faqs = [
    { q: 'How long does the approval process take?', a: 'Initial document assessment and CAC validation typically conclude within 3-5 business days. Once cleared, portal sandbox keys are issued instantly.' },
    { q: 'What compliance credentials do transport operators need?', a: 'Applicants must supply authentic CAC Certificates of Incorporation, comprehensive vehicle insurance logs, and valid driving licenses for all assigned pilots.' },
    { q: 'Are there upfront fees for listing routes on RoutePro?', a: 'RoutePro operates on a pure commission-on-sales model. Setting up is completely free; we only deduct a transparent percentage on successful bookings.' },
    { q: 'How are ticket payment reconciliations managed?', a: 'Settle payouts weekly. Payout balances disburse automatically directly to the operators corporate bank account every Tuesday.' }
  ]

  return (
    <div style={{ fontFamily: "'Outfit','Inter',sans-serif", background: '#F8FAFC', color: '#0F172A', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');`}</style>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        color: '#FFFFFF',
        padding: '80px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '80%',
          height: '150%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <span style={{
            background: 'rgba(22, 163, 74, 0.15)',
            color: '#4ADE80',
            padding: '6px 16px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 20
          }}>
            <Sparkles size={14} /> Join RoutePro Ecosystem
          </span>
          <h1 style={{
            fontSize: 'calc(24px + 2vw)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: 20
          }}>
            Let's build the future of <span style={{ color: '#16A34A' }}>transportation</span> together.
          </h1>
          <p style={{
            fontSize: 'calc(14px + 0.3vw)',
            color: '#94A3B8',
            maxWidth: 600,
            margin: '0 auto 32px',
            lineHeight: 1.6
          }}>
            Digitize your ticketing operations, expand fleet visibility, and access millions of travelers across the country's most integrated transport network.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={scrollForm}
              style={{
                background: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '14px 28px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 15,
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#15803D'}
              onMouseLeave={e => e.currentTarget.style.background = '#16A34A'}
            >
              Become a Partner <ArrowRight size={16} />
            </button>
            <a
              href="#learn-more"
              style={{
                border: '1.5px solid #334155',
                color: '#E2E8F0',
                background: 'transparent',
                borderRadius: 10,
                padding: '14px 28px',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: 15,
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#16A34A'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div id="learn-more" style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        
        {/* Partnership types */}
        <div style={{ textAlign: 'center', marginBottom: 54 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Partnership Frameworks</h2>
          <p style={{ fontSize: 15, color: '#64748B', marginTop: 6 }}>Identify your organization category and view specialized platform capabilities.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 70 }}>
          {partnershipTypes.map((type, index) => (
            <div key={index} style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: 24,
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'
            }}
            >
              <div style={{
                display: 'inline-flex',
                background: '#F0FDF4',
                color: '#16A34A',
                padding: 10,
                borderRadius: 10,
                marginBottom: 16
              }}>
                {index === 0 && <Building2 size={20} />}
                {index === 1 && <Settings size={20} />}
                {index === 2 && <Handshake size={20} />}
                {index === 3 && <Users size={20} />}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{type.title}</h3>
              <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 16 }}>{type.desc}</p>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>Included Niches</p>
                <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {type.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div style={{
          background: '#0F172A',
          color: '#FFFFFF',
          borderRadius: 24,
          padding: '54px 40px',
          marginBottom: 70,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', right: 0, bottom: 0, width: '40%', height: '80%', background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 800, marginBottom: 40 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Why Integrate with RoutePro?</h2>
            <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Unlock immediate technological leverage for your transport infrastructure.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {benefits.map((b, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 14 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(22, 163, 74, 0.15)',
                  color: '#4ADE80',
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  flexShrink: 0
                }}>
                  <b.icon size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>{b.title}</h4>
                  <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow steps */}
        <div style={{ marginBottom: 70 }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A' }}>Partnership Review Workflow</h2>
            <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Our structured transition framework guarantees onboarding success.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {workflow.map((w, idx) => (
              <div key={idx} style={{ background: '#FFFFFF', padding: 20, borderRadius: 14, border: '1px solid #E2E8F0', position: 'relative' }}>
                <span style={{
                  position: 'absolute', top: 12, right: 16, fontSize: 28, fontWeight: 800, color: '#F1F5F9'
                }}>{w.step}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 8, paddingRight: 20 }}>{w.title}</h3>
                <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Split Section: Form & FAQs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, alignItems: 'start' }}>
          
          {/* Form Card */}
          <div id="application-form" style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            padding: 32,
            boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 6 }}>Apply for Partnership</h2>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Submit registration credentials to initiate the screening review.</p>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 8, fontSize: 12, marginBottom: 18 }}>
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <CheckCircle size={48} style={{ color: '#16A34A', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Application Received!</h3>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 6, maxWidth: 360, margin: '6px auto 0', lineHeight: 1.5 }}>
                  Thank you. Your proposal has been successfully registered on the RoutePro Super Admin Control Center. An onboarding associate will reach out shortly.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  style={{
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 20px',
                    fontWeight: 600,
                    fontSize: 13,
                    marginTop: 18,
                    cursor: 'pointer'
                  }}
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Organization Name *</label>
                    <input
                      style={inputStyle}
                      value={formData.orgName}
                      onChange={e => handleInputChange('orgName', e.target.value)}
                      placeholder="e.g. RoutePro Logistics"
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Organization Type</label>
                    <select
                      style={selectStyle}
                      value={formData.orgType}
                      onChange={e => handleInputChange('orgType', e.target.value)}
                    >
                      <option value="Luxury Coach">Luxury Coach</option>
                      <option value="Bus operator">Bus Operator</option>
                      <option value="Ferry operator">Ferry/Boat Link</option>
                      <option value="Rail service">Rail service</option>
                      <option value="Payment Provider">Payment Provider</option>
                      <option value="Tech Provider">Tech Provider</option>
                      <option value="Corporate Partner">Corporate Partner</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Contact Person *</label>
                    <input
                      style={inputStyle}
                      value={formData.contactPerson}
                      onChange={e => handleInputChange('contactPerson', e.target.value)}
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Partnership Category</label>
                    <select
                      style={selectStyle}
                      value={formData.partnershipCategory}
                      onChange={e => handleInputChange('partnershipCategory', e.target.value)}
                    >
                      <option value="Transport Operators">Transport Operators</option>
                      <option value="Technology Partners">Technology Partners</option>
                      <option value="Commercial Partners">Commercial Partners</option>
                      <option value="Marketing Partners">Marketing Partners</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Corporate Email *</label>
                    <input
                      type="email"
                      style={inputStyle}
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder="name@organization.com"
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input
                      type="tel"
                      style={inputStyle}
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder="+234..."
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Proposal & Fleet Description</label>
                  <textarea
                    style={{ ...inputStyle, resize: 'vertical' }}
                    rows={4}
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="Briefly state your fleet size, route operations, or integration scope..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: '#16A34A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    padding: '13px 24px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 8,
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? (
                    <Clock className="animate-spin" size={16} />
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* FAQs Accordion */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <HelpCircle size={20} style={{ color: '#16A34A' }} />
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Onboarding FAQs</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faqs.map((faq, index) => (
                <div key={index} style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden'
                }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', paddingRight: 12 }}>{faq.q}</span>
                    {openFaq === index ? (
                      <ChevronUp size={16} style={{ color: '#64748B', flexShrink: 0 }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: '#64748B', flexShrink: 0 }} />
                    )}
                  </button>
                  {openFaq === index && (
                    <div style={{
                      padding: '0 20px 16px',
                      fontSize: 12,
                      color: '#64748B',
                      lineHeight: 1.6,
                      borderTop: '1px solid #F1F5F9',
                      paddingTop: 12
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#475569',
  marginBottom: 5,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.02em'
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #CBD5E1',
  fontSize: 13,
  color: '#334155',
  outline: 'none',
  background: '#FFFFFF',
  boxSizing: 'border-box' as const
}

const selectStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #CBD5E1',
  fontSize: 13,
  color: '#334155',
  outline: 'none',
  background: '#FFFFFF',
  boxSizing: 'border-box' as const,
  cursor: 'pointer'
}
