'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare, AlertTriangle, HelpCircle,
  CheckCircle, ArrowLeft, Mail, Phone, Clock,
  Send, Loader
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const TICKET_TYPES = [
  { value: 'booking_issue', label: 'Booking Issue' },
  { value: 'payment_problem', label: 'Payment / Refund Problem' },
  { value: 'company_complaint', label: 'Company / Driver Complaint' },
  { value: 'technical_issue', label: 'Technical / App Issue' },
  { value: 'account_issue', label: 'Account Access Issue' },
  { value: 'other', label: 'Other' },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    ticket_type: 'booking_issue',
    booking_ref: '',
    subject: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Insert into disputes table
      const { error: insertErr } = await supabase.from('disputes').insert({
        reporter_id: user?.id ?? null,
        reporter_email: form.email || user?.email,
        reporter_name: form.name,
        reporter_phone: form.phone,
        ticket_type: form.ticket_type,
        booking_ref: form.booking_ref || null,
        subject: form.subject,
        description: form.description,
        status: 'open',
        priority: form.ticket_type === 'payment_problem' ? 'high' : 'normal',
      });

      if (insertErr) throw insertErr;

      // Audit log
      try {
        await supabase.from('audit_logs').insert({
          actor_id: user?.id ?? null,
          actor_email: form.email || user?.email,
          action: 'SUPPORT_TICKET_CREATED',
          entity_type: 'dispute',
          new_value: { subject: form.subject, type: form.ticket_type },
        });
      } catch (_) {}

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit your ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (field: string, val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.07)' }}>
          <div style={{ width: 64, height: 64, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="#16A34A" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Ticket Submitted!</h2>
          <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 28 }}>
            We've received your support request. Our team will review it and respond to <strong>{form.email}</strong> within 24 hours.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/en/help-center" style={{ display: 'inline-block', background: '#16A34A', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
              Help Center
            </Link>
            <button
              onClick={() => { setSuccess(false); setForm({ name: '', email: '', phone: '', ticket_type: 'booking_issue', booking_ref: '', subject: '', description: '' }); }}
              style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
            >
              New Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(22,163,74,0.2)', border: '1px solid rgba(22,163,74,0.4)', color: '#4ADE80', borderRadius: 999, padding: '5px 18px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          Support Centre
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, color: '#FFFFFF', marginBottom: 12, fontFamily: 'Outfit, sans-serif' }}>
          Contact Us
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 15, maxWidth: 420, margin: '0 auto' }}>
          Raise a support ticket and we'll get back to you as quickly as possible.
        </p>
      </section>

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { icon: Mail, color: '#16A34A', bg: '#DCFCE7', title: 'Email Support', desc: 'support@routepro.ng', sub: 'Responses within 24h' },
            { icon: Phone, color: '#2563EB', bg: '#DBEAFE', title: 'Call Us', desc: '+234 800 123 4567', sub: 'Mon–Fri, 8am–8pm WAT' },
            { icon: Clock, color: '#7C3AED', bg: '#EDE9FE', title: 'Response Time', desc: '< 24 Hours', sub: 'For all ticket types' },
          ].map(({ icon: Icon, color, bg, title, desc, sub }) => (
            <div key={title} style={{ background: '#fff', borderRadius: 14, padding: '20px 20px', border: '1px solid #E2E8F0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color }}>{desc}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 28, alignItems: 'start' }}>

          {/* Ticket Form */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={20} color="#16A34A" />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Submit a Support Ticket</h2>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Fill out all required fields</p>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '12px 16px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Contact Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelS}>Full Name *</label>
                  <input required value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your full name" style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Email Address *</label>
                  <input required type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@email.com" style={inputS} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelS}>Phone Number</label>
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+234-800-000-0000" style={inputS} />
                </div>
                <div>
                  <label style={labelS}>Booking Reference (if any)</label>
                  <input value={form.booking_ref} onChange={e => update('booking_ref', e.target.value)} placeholder="e.g. BK-1234567" style={inputS} />
                </div>
              </div>

              <div>
                <label style={labelS}>Issue Type *</label>
                <select required value={form.ticket_type} onChange={e => update('ticket_type', e.target.value)} style={{ ...inputS, cursor: 'pointer' }}>
                  {TICKET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={labelS}>Subject *</label>
                <input required value={form.subject} onChange={e => update('subject', e.target.value)} placeholder="Brief description of your issue" style={inputS} />
              </div>

              <div>
                <label style={labelS}>Detailed Description *</label>
                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Please describe your issue in detail including dates, amounts, and what happened..."
                  style={{ ...inputS, resize: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {submitting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : <><Send size={16} /> Submit Ticket</>}
              </button>
            </form>
          </div>

          {/* Side Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <HelpCircle size={18} color="#7C3AED" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Before You Contact Us</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Check your email for booking confirmations',
                  'Check the Help Center for common questions',
                  'Allow 5–10 mins for e-tickets to arrive',
                  'Refunds take 5–7 business days to process',
                ].map((tip, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 18, height: 18, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>{tip}</p>
                  </div>
                ))}
              </div>
              <Link href="/en/help-center" style={{ display: 'block', marginTop: 16, textAlign: 'center', background: '#F0FDF4', color: '#16A34A', textDecoration: 'none', padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #DCFCE7' }}>
                Browse Help Center →
              </Link>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A5F)', borderRadius: 14, padding: 20, color: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#4ADE80' }}>Emergency Support</div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 12 }}>
                For urgent safety issues or stranded passengers, call our emergency line immediately.
              </p>
              <a href="tel:+2348001234567" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff', textDecoration: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}>
                <Phone size={14} /> +234 800 123 4567
              </a>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelS: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#475569',
  marginBottom: 6,
};

const inputS: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid #E2E8F0',
  borderRadius: 8,
  fontSize: 13,
  outline: 'none',
  background: '#F8FAFC',
  color: '#0F172A',
  boxSizing: 'border-box',
};
