'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, CreditCard, Building2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { usePaystackPayment } from 'react-paystack'

export default function VerifyPaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')

  const VERIFICATION_FEE = 50000 // 50,000 NGN

  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/en/login')
        return
      }
      setUserEmail(user.email || '')

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      if (!error && data) {
        if (data.status === 'verified') {
          router.push('/en/company/dashboard')
        } else {
          setCompany(data)
        }
      } else {
        router.push('/en/company/onboarding/step-1')
      }
      setLoading(false)
    }

    checkStatus()
  }, [router])

  // Paystack Configuration
  const config = {
    reference: `verify_${new Date().getTime()}`,
    email: userEmail,
    amount: VERIFICATION_FEE * 100, // Kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  }

  const initializePayment = usePaystackPayment(config)

  const onSuccess = async (reference: any) => {
    setLoading(true)
    
    // Update company verification status
    const { error } = await supabase
      .from('companies')
      .update({ 
        verification_fee_paid: true,
        status: 'fee_paid' // Admin still needs to review documents
      })
      .eq('id', company.id)

    if (!error) {
      alert('Payment successful! Your application is now under final review by the Super Admin.')
      router.push('/en/company/dashboard')
    } else {
      alert('Payment successful but status update failed. Please contact support with reference: ' + reference.reference)
      setLoading(false)
    }
  }

  const onClose = () => {
    console.log('Verification payment window closed')
  }

  const handlePayment = () => {
    if (!config.publicKey) {
      alert("Payment gateway is not configured properly.")
      return
    }
    initializePayment({ onSuccess, onClose })
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '60px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, background: '#4F46E5', borderRadius: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <ShieldCheck size={32} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', fontFamily: 'Outfit, sans-serif', marginBottom: 16 }}>
            Company Verification Fee
          </h1>
          <p style={{ fontSize: 16, color: '#64748B' }}>
            Complete your onboarding by paying the mandatory verification fee. This allows us to process your CAC documents, vehicle inspections, and activate your account.
          </p>
        </div>

        <div className="mt-card" style={{ padding: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ width: 48, height: 48, background: '#F1F5F9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{company?.name}</h3>
              <p style={{ fontSize: 14, color: '#64748B' }}>CAC: {company?.cac_number}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <CheckCircle2 size={20} color="#16A34A" />
              <span style={{ color: '#334155' }}>Document Review & Verification</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <CheckCircle2 size={20} color="#16A34A" />
              <span style={{ color: '#334155' }}>Platform Listing Activation</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <CheckCircle2 size={20} color="#16A34A" />
              <span style={{ color: '#334155' }}>24/7 Priority Support Access</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, background: '#F8FAFC', padding: 24, borderRadius: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Total Amount</span>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#16A34A' }}>₦{VERIFICATION_FEE.toLocaleString()}</span>
          </div>

          <button 
            onClick={handlePayment}
            className="mt-btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#4F46E5' }}
          >
            <CreditCard size={20} /> Pay Verification Fee
          </button>
          
          <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', marginTop: 20 }}>
            By paying, you agree to our Terms of Service. Verification is subject to final document approval by the Super Admin.
          </p>
        </div>

      </div>
    </div>
  )
}
