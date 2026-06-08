import { Metadata } from 'next'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — RoutePro',
  description: 'Understand RoutePro refund eligibility, cancellation timelines, and how to request a refund for your booking.',
}

interface Props { params: Promise<{ locale: string }> }

export default async function RefundPolicyPage({ params }: Props) {
  const { locale } = await params
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 36, marginBottom: 12, fontFamily: "'Outfit', sans-serif", borderLeft: '4px solid #16A34A', paddingLeft: 12 }
  const p: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, margin: '0 0 12px' }
  const ul: React.CSSProperties = { paddingLeft: 20, margin: '8px 0 16px' }
  const li: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 4 }

  const tableRow = (label: string, policy: string, color: string) => (
    <tr key={label}>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#334155', borderBottom: '1px solid #F1F5F9' }}>{label}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>{policy}</td>
      <td style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ background: `${color}15`, color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
          {label.includes('24h') || label.includes('48h') || label.includes('Full') ? 'Eligible' : label.includes('No') ? 'Ineligible' : 'Partial'}
        </span>
      </td>
    </tr>
  )

  return (
    <LegalPageLayout title="Refund & Cancellation Policy" subtitle="Refund eligibility, timelines, and how to request a refund for bookings, rentals, and marketplace purchases." locale={locale} currentPath="refund-policy">

      <p style={{ ...p, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: '16px 20px', color: '#92400E', fontWeight: 600 }}>
        Scope: All Users — Passengers, Rental Customers, and Marketplace Buyers
      </p>

      <h2 style={h2}>1. Booking Cancellations</h2>
      <p style={p}>Refund eligibility for transport bookings depends on how far in advance the cancellation is made:</p>
      <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div className="mt-table-wrap">
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>Scenario</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>Refund Policy</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#94A3B8', textAlign: 'left', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Cancelled 48h+ before departure', 'Full refund to wallet or original payment method', '#16A34A'],
              ['Cancelled 24–48h before departure', 'Up to 70% refund, subject to operator policy', '#D97706'],
              ['Cancelled within 24h', 'Subject to operator policy — typically 50% or less', '#EF4444'],
              ['No-show (trip departed)', 'No refund unless exceptional circumstances apply', '#DC2626'],
              ['Operator cancels trip', 'Full refund guaranteed within 5–7 business days', '#16A34A'],
            ].map(([l, pp, c]) => tableRow(l as string, pp as string, c as string))}
          </tbody>
        </table>
</div>
      </div>

      <h2 style={h2}>2. Rental Cancellations</h2>
      <ul style={ul}>
        <li style={li}>Cancellations made 72 hours or more before the rental start date qualify for a full refund.</li>
        <li style={li}>Cancellations within 48 hours may incur a cancellation fee determined by the rental provider.</li>
        <li style={li}>Early returns do not automatically qualify for a prorated refund.</li>
        <li style={li}>Damage deposits are refundable upon vehicle inspection at return, subject to the rental provider's assessment.</li>
      </ul>

      <h2 style={h2}>3. Marketplace Purchases</h2>
      <ul style={ul}>
        <li style={li}>Vehicle purchases through the marketplace are generally final.</li>
        <li style={li}>Refunds may be considered if there is documented misrepresentation by the seller.</li>
        <li style={li}>Disputes should be raised within 7 days of the agreed transaction date.</li>
        <li style={li}>RoutePro does not guarantee refunds for private vehicle sales.</li>
      </ul>

      <h2 style={h2}>4. How to Request a Refund</h2>
      <ul style={ul}>
        <li style={li}>Log in to your RoutePro account and navigate to your Bookings or Trips.</li>
        <li style={li}>Select the relevant booking and click "Request Refund" or "Cancel Booking".</li>
        <li style={li}>Alternatively, contact RoutePro Support through the Help Center.</li>
      </ul>

      <h2 style={h2}>5. Refund Processing Times</h2>
      <ul style={ul}>
        <li style={li}><strong>RoutePro Wallet:</strong> 1–2 business hours</li>
        <li style={li}><strong>Card Payments:</strong> 5–10 business days (depending on your bank)</li>
        <li style={li}><strong>Bank Transfer:</strong> 3–7 business days</li>
      </ul>

      <h2 style={h2}>6. Non-Refundable Fees</h2>
      <ul style={ul}>
        <li style={li}>Platform service fees are non-refundable except where RoutePro is at fault.</li>
        <li style={li}>SMS/email notification fees are non-refundable.</li>
        <li style={li}>Subscription fees are non-refundable after the billing cycle has commenced.</li>
      </ul>

      <h2 style={h2}>7. Disputes</h2>
      <p style={p}>If you believe a refund decision is unfair, you may escalate to RoutePro's dispute resolution team. All disputes are reviewed within 5–7 business days.</p>
    </LegalPageLayout>
  )
}
