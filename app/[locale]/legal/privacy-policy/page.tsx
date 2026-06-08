import { Metadata } from 'next'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy — RoutePro',
  description: 'Learn how RoutePro collects, uses, protects, and manages your personal information.',
}

interface Props { params: Promise<{ locale: string }> }

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 36, marginBottom: 12, fontFamily: "'Outfit', sans-serif", borderLeft: '4px solid #16A34A', paddingLeft: 12 }
  const p: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, margin: '0 0 12px' }
  const ul: React.CSSProperties = { paddingLeft: 20, margin: '8px 0 16px' }
  const li: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 4 }

  return (
    <LegalPageLayout title="Privacy Policy" subtitle="How RoutePro collects, uses, protects, and manages your personal information." locale={locale} currentPath="privacy-policy">
      <p style={{ ...p, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '16px 20px', color: '#1E40AF', fontWeight: 600 }}>
        Scope: All Users — Passengers, Companies, Dealers, Rental Providers, and Applicants
      </p>

      <h2 style={h2}>1. Information We Collect</h2>
      <p style={p}>We collect information you provide directly to us, as well as information generated through your use of our platform:</p>
      <ul style={ul}>
        <li style={li}><strong>Identity Information:</strong> Name, email address, phone number, government-issued ID</li>
        <li style={li}><strong>Account Information:</strong> Username, password, profile data, preferences</li>
        <li style={li}><strong>Transaction Information:</strong> Booking records, payment history, wallet transactions</li>
        <li style={li}><strong>Device & Usage Data:</strong> IP addresses, browser type, pages visited, session duration</li>
        <li style={li}><strong>Location Data:</strong> City, state, route preferences (where provided)</li>
        <li style={li}><strong>Communications:</strong> Messages with support, feedback, and reviews</li>
      </ul>

      <h2 style={h2}>2. How We Use Your Information</h2>
      <ul style={ul}>
        <li style={li}>To create and manage your account</li>
        <li style={li}>To process bookings, payments, and refunds</li>
        <li style={li}>To provide customer support</li>
        <li style={li}>To verify the identity of companies and service providers</li>
        <li style={li}>To improve platform features and user experience</li>
        <li style={li}>To send service notifications and updates</li>
        <li style={li}>To detect and prevent fraud or misuse</li>
        <li style={li}>To comply with legal obligations</li>
      </ul>

      <h2 style={h2}>3. Information Sharing</h2>
      <p style={p}>We do not sell your personal information. We may share your data with:</p>
      <ul style={ul}>
        <li style={li}>Transport operators and service providers you book with (to fulfil your booking)</li>
        <li style={li}>Payment processors and financial institutions</li>
        <li style={li}>Identity verification services</li>
        <li style={li}>Law enforcement where legally required</li>
      </ul>

      <h2 style={h2}>4. Data Retention</h2>
      <p style={p}>We retain your personal data for as long as your account is active and for a reasonable period thereafter to fulfil legal and audit obligations. You may request deletion of your data by contacting support.</p>

      <h2 style={h2}>5. Cookies & Tracking</h2>
      <p style={p}>We use cookies and similar technologies to maintain your session, remember preferences, and understand how users interact with our platform. You can control cookie settings through your browser.</p>

      <h2 style={h2}>6. Your Rights</h2>
      <ul style={ul}>
        <li style={li}>Access: Request a copy of the personal data we hold about you</li>
        <li style={li}>Correction: Request corrections to inaccurate data</li>
        <li style={li}>Deletion: Request deletion of your account and data (subject to legal holds)</li>
        <li style={li}>Portability: Receive your data in a machine-readable format</li>
        <li style={li}>Objection: Object to processing based on legitimate interests</li>
      </ul>

      <h2 style={h2}>7. Security</h2>
      <p style={p}>RoutePro employs industry-standard security measures including HTTPS encryption, secure database storage, role-based access controls, and regular security audits. No system is completely secure; we encourage you to protect your account credentials.</p>

      <h2 style={h2}>8. Changes to This Policy</h2>
      <p style={p}>We may update this Privacy Policy. Significant changes will be communicated via email or in-app notification. Continued use after changes constitutes acceptance.</p>

      <h2 style={h2}>9. Contact</h2>
      <p style={p}>For privacy concerns or data requests, contact RoutePro Support through official channels on the platform.</p>
    </LegalPageLayout>
  )
}
