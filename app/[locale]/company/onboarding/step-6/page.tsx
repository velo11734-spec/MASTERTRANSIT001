'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function Step6() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [agree, setAgree] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User session not found')
      }

      // Update company status to PENDING
      const { error } = await supabase
        .from('companies')
        .update({
          status: 'PENDING',
        })
        .eq('owner_id', user.id)

      if (error) throw error
      router.push('/en/company/verify-payment')
    } catch (error: any) {
      console.error('Submission Error:', error)
      alert(error.message || 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif' }}>Review & Submit</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>Please review your information before final submission.</p>
      </div>

      <div className="mt-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} color="#16A34A" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Business Information</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>Company name, RC number, fleet size</p>
              </div>
            </div>
            <button onClick={() => router.push('/en/company/onboarding/step-1')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} color="#16A34A" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Office & Contact</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>HQ address, support email, phone</p>
              </div>
            </div>
            <button onClick={() => router.push('/en/company/onboarding/step-2')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} color="#16A34A" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Identity Verification</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>Director ID, BVN</p>
              </div>
            </div>
            <button onClick={() => router.push('/en/company/onboarding/step-3')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} color="#16A34A" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Banking Information</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>Account details for payouts</p>
              </div>
            </div>
            <button onClick={() => router.push('/en/company/onboarding/step-4')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} color="#16A34A" />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Vehicle Documents</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>CAC, Insurance policies</p>
              </div>
            </div>
            <button onClick={() => router.push('/en/company/onboarding/step-5')} style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
          </div>

        </div>
      </div>

      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 16, marginBottom: 24, display: 'flex', gap: 12 }}>
        <AlertCircle size={20} color="#2563EB" style={{ flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1E3A8A', marginBottom: 4 }}>Platform Escrow Agreement</p>
          <p style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.5 }}>
            By submitting this application, you agree to RoutePro's escrow terms: all passenger payments are held securely by the platform and released to your company account after successful trip completion, minus the agreed service commission.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 24 }}>
          <input 
            type="checkbox" 
            checked={agree} 
            onChange={(e) => setAgree(e.target.checked)}
            style={{ width: 18, height: 18, marginTop: 2, accentColor: '#16A34A' }}
            required
          />
          <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            I declare that the information provided is accurate and I agree to the <a href="#" style={{ color: '#16A34A' }}>Terms of Service</a> and <a href="#" style={{ color: '#16A34A' }}>Privacy Policy</a>.
          </span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button type="button" onClick={() => router.back()} className="mt-btn-outline" style={{ padding: '12px 24px' }}>Back</button>
          <button type="submit" disabled={loading || !agree} className="mt-btn-primary" style={{ padding: '12px 32px' }}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  )
}
