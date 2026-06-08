import { Metadata } from 'next'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Company & Business Terms — RoutePro',
  description: 'Terms and conditions for transport operators, companies, and business entities using the RoutePro platform.',
}

interface Props { params: Promise<{ locale: string }> }

export default async function CompanyTermsPage({ params }: Props) {
  const { locale } = await params
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 36, marginBottom: 12, fontFamily: "'Outfit', sans-serif", borderLeft: '4px solid #D97706', paddingLeft: 12 }
  const p: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, margin: '0 0 12px' }
  const ul: React.CSSProperties = { paddingLeft: 20, margin: '8px 0 16px' }
  const li: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 4 }

  return (
    <LegalPageLayout title="Company & Business Terms" subtitle="Terms governing the registration, operation, and obligations of companies and transport operators on RoutePro." locale={locale} currentPath="company-terms">
      <p style={{ ...p, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 12, padding: '16px 20px', color: '#92400E', fontWeight: 600 }}>
        Scope: Transport Operators, Registered Companies, Business Entities
      </p>

      <h2 style={h2}>1. Company Registration</h2>
      <ul style={ul}>
        <li style={li}>Companies must provide accurate business information, registration documents, and valid licenses.</li>
        <li style={li}>All submitted documents must be authentic and current.</li>
        <li style={li}>RoutePro reserves the right to approve, reject, suspend, or terminate any company registration.</li>
        <li style={li}>Companies are responsible for keeping their information updated at all times.</li>
      </ul>

      <h2 style={h2}>2. Verification Requirements</h2>
      <ul style={ul}>
        <li style={li}>Companies must complete RoutePro's verification process before accessing the full company dashboard.</li>
        <li style={li}>Verification may require: CAC Certificate, Tax Identification Number (TIN), valid license(s), and authorized signatory details.</li>
        <li style={li}>Verification approval does not constitute an endorsement of the company's operations.</li>
      </ul>

      <h2 style={h2}>3. Service Obligations</h2>
      <ul style={ul}>
        <li style={li}>Companies must provide services exactly as listed and booked by passengers.</li>
        <li style={li}>Seat availability must be accurately reflected at all times.</li>
        <li style={li}>Trip cancellations by operators must be communicated to passengers promptly.</li>
        <li style={li}>Operators are responsible for full refunds when trips are cancelled by the operator.</li>
      </ul>

      <h2 style={h2}>4. Fleet & Driver Compliance</h2>
      <ul style={ul}>
        <li style={li}>All vehicles listed must be roadworthy and pass applicable safety inspections.</li>
        <li style={li}>Drivers must hold valid licenses appropriate to the vehicle class.</li>
        <li style={li}>Companies are responsible for conducting background checks on their drivers.</li>
        <li style={li}>RoutePro may require proof of fleet insurance and vehicle inspection certificates.</li>
      </ul>

      <h2 style={h2}>5. Platform Commission & Fees</h2>
      <ul style={ul}>
        <li style={li}>A platform commission is applied to bookings processed through RoutePro.</li>
        <li style={li}>Commission rates are available in the company dashboard and may be updated with notice.</li>
        <li style={li}>Companies may subscribe to premium plans to access additional features.</li>
      </ul>

      <h2 style={h2}>6. Payouts</h2>
      <ul style={ul}>
        <li style={li}>Earnings are processed to the company's registered bank account or wallet.</li>
        <li style={li}>Payouts are processed within the timeframe specified in the company dashboard.</li>
        <li style={li}>RoutePro may withhold payouts during active dispute investigations.</li>
      </ul>

      <h2 style={h2}>7. Company Conduct</h2>
      <ul style={ul}>
        <li style={li}>Companies must not engage in price manipulation, deceptive practices, or collusion.</li>
        <li style={li}>Staff and drivers must treat passengers with professionalism and respect.</li>
        <li style={li}>Companies are responsible for all actions of their employees and agents on the platform.</li>
      </ul>

      <h2 style={h2}>8. Termination</h2>
      <ul style={ul}>
        <li style={li}>RoutePro may suspend or terminate a company account for repeated complaints, fraud, policy violations, or safety concerns.</li>
        <li style={li}>Companies may deactivate their account at any time by contacting RoutePro Support.</li>
      </ul>
    </LegalPageLayout>
  )
}
