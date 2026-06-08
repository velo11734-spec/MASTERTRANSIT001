import { Metadata } from 'next'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Terms & Conditions — RoutePro',
  description: 'Read the full RoutePro Terms and Conditions governing use of our transportation booking platform, marketplace, and services.',
}

interface Props { params: Promise<{ locale: string }> }

export default async function TermsAndConditionsPage({ params }: Props) {
  const { locale } = await params

  const h2Style: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 36, marginBottom: 12, fontFamily: "'Outfit', sans-serif", borderLeft: '4px solid #16A34A', paddingLeft: 12 }
  const h3Style: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#1E293B', marginTop: 20, marginBottom: 8 }
  const pStyle: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, margin: '0 0 12px' }
  const ulStyle: React.CSSProperties = { paddingLeft: 20, margin: '8px 0 16px' }
  const liStyle: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 4 }
  const badgeRow: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }
  const badge = (label: string, color: string): React.ReactNode => (
    <span key={label} style={{ background: `${color}15`, color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: `1px solid ${color}30` }}>{label}</span>
  )

  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle="These Terms and Conditions govern your access to and use of the RoutePro platform and all associated services."
      lastUpdated="June 2026"
      locale={locale}
      currentPath="terms-and-conditions"
    >
      {/* Scope Badges */}
      <div style={badgeRow}>
        {[
          ['All Users', '#2563EB'], ['Passengers', '#16A34A'], ['Companies', '#D97706'],
          ['Dealers', '#7C3AED'], ['Rental Providers', '#0891B2'], ['Applicants', '#EC4899'],
        ].map(([l, c]) => badge(l as string, c as string))}
      </div>

      <p style={{ ...pStyle, fontSize: 15, color: '#334155', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', marginBottom: 28 }}>
        Welcome to RoutePro. By accessing or using RoutePro, you agree to be bound by these Terms and Conditions. If you do not agree, you must not use the platform.
      </p>

      <h2 style={h2Style}>1. Definitions</h2>
      <ul style={ulStyle}>
        <li style={liStyle}><strong>"RoutePro"</strong> refers to the platform, its owners, operators, affiliates, subsidiaries, employees, contractors, and authorized representatives.</li>
        <li style={liStyle}><strong>"User"</strong> refers to any individual using the platform.</li>
        <li style={liStyle}><strong>"Company"</strong> refers to any registered business entity using RoutePro.</li>
        <li style={liStyle}><strong>"Transport Operator"</strong> refers to a company offering transportation services.</li>
        <li style={liStyle}><strong>"Vehicle Dealer"</strong> refers to any company or authorized seller listing vehicles for sale.</li>
        <li style={liStyle}><strong>"Rental Provider"</strong> refers to any company or individual offering vehicles for rent.</li>
        <li style={liStyle}><strong>"Applicant"</strong> refers to any person applying for opportunities through RoutePro Careers.</li>
        <li style={liStyle}><strong>"Booking"</strong> refers to any reservation made through the platform.</li>
      </ul>

      <h2 style={h2Style}>2. Eligibility</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>Users must be legally capable of entering binding agreements.</li>
        <li style={liStyle}>Users must provide accurate and truthful information.</li>
        <li style={liStyle}>RoutePro may suspend or terminate accounts that contain false information.</li>
      </ul>

      <h2 style={h2Style}>3. Account Responsibilities</h2>
      <p style={pStyle}>Users are responsible for:</p>
      <ul style={ulStyle}>
        <li style={liStyle}>Maintaining account security and protecting passwords</li>
        <li style={liStyle}>Protecting login credentials at all times</li>
        <li style={liStyle}>Providing accurate information and updating profile information as needed</li>
        <li style={liStyle}>All activities conducted through their accounts</li>
      </ul>

      <h2 style={h2Style}>4. Platform Services</h2>
      <p style={pStyle}>RoutePro may provide any or all of the following services, which may be updated without prior notice:</p>
      <ul style={ulStyle}>
        {['Transportation Booking Services', 'Vehicle Marketplace Services', 'Vehicle Rental Services', 'Company Management Services', 'Recruitment Services', 'Business Management Tools', 'Payment & Wallet Services', 'Analytics Services'].map(s => <li key={s} style={liStyle}>{s}</li>)}
      </ul>

      <h2 style={h2Style}>5. User Conduct</h2>
      <p style={pStyle}>Users must not engage in any of the following:</p>
      <ul style={ulStyle}>
        {['Commit fraud or provide false information', 'Impersonate any individual or organization', 'Attempt unauthorized access to any system', 'Distribute malware or harmful code', 'Abuse staff, customers, or other users', 'Manipulate reviews or ratings', 'Misuse payment systems or engage in chargebacks', 'Violate applicable laws or regulations'].map(s => <li key={s} style={liStyle}>{s}</li>)}
      </ul>
      <p style={pStyle}>RoutePro reserves the right to suspend or permanently ban violators.</p>

      <h2 style={h2Style}>6. Bookings</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>RoutePro facilitates bookings between customers and service providers.</li>
        <li style={liStyle}>Availability is subject to provider capacity.</li>
        <li style={liStyle}>Booking confirmations are issued electronically.</li>
        <li style={liStyle}>Passengers are responsible for arriving on time.</li>
        <li style={liStyle}>Transport operators are responsible for providing booked services as confirmed.</li>
      </ul>

      <h2 style={h2Style}>7. Payments</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>Payments are processed through approved payment partners.</li>
        <li style={liStyle}>Users authorize RoutePro to process payments related to bookings, rentals, purchases, subscriptions, and platform services.</li>
        <li style={liStyle}>Applicable fees and taxes may apply.</li>
        <li style={liStyle}>Payment failures may result in booking cancellation.</li>
      </ul>

      <h2 style={h2Style}>8. Refunds</h2>
      <p style={pStyle}>Refund eligibility depends on provider policies, cancellation timing, and applicable regulations. See the full <a href={`/${locale}/legal/refund-policy`} style={{ color: '#16A34A', fontWeight: 600 }}>Refund & Cancellation Policy</a>.</p>

      <h2 style={h2Style}>9. Vehicle Marketplace</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>RoutePro serves as a marketplace connecting buyers and sellers.</li>
        <li style={liStyle}>Vehicle sellers are responsible for listing accuracy, ownership verification, vehicle legality, and condition disclosures.</li>
        <li style={liStyle}>Buyers are encouraged to conduct independent inspections before purchase.</li>
        <li style={liStyle}>RoutePro does not guarantee vehicle condition or seller representations.</li>
      </ul>

      <h2 style={h2Style}>10. Vehicle Rentals</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>Rental providers determine rental conditions, security deposits, and usage restrictions.</li>
        <li style={liStyle}>Users are responsible for vehicle care, legal compliance, timely returns, and damage liabilities where applicable.</li>
      </ul>

      <h2 style={h2Style}>11. Careers and Recruitment</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>RoutePro may facilitate employment opportunities.</li>
        <li style={liStyle}>RoutePro does not guarantee employment, interview invitations, or hiring outcomes.</li>
        <li style={liStyle}>Applicants are responsible for providing truthful information.</li>
        <li style={liStyle}>Employers are responsible for lawful recruitment practices.</li>
      </ul>

      <h2 style={h2Style}>12. Company Registration</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>Companies must provide accurate information, verification documents, required licenses, and proof of authority.</li>
        <li style={liStyle}>RoutePro may approve, reject, suspend, or terminate company registrations at its sole discretion.</li>
      </ul>

      <h2 style={h2Style}>13. Verification</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>Verification status indicates that information has undergone a review process.</li>
        <li style={liStyle}>Verification does not guarantee future conduct, service quality, business performance, or financial stability.</li>
        <li style={liStyle}>Users should exercise reasonable judgment in all transactions.</li>
      </ul>

      <h2 style={h2Style}>14. Wallets</h2>
      <ul style={ulStyle}>
        <li style={liStyle}>Wallet balances are displayed electronically and are subject to review.</li>
        <li style={liStyle}>RoutePro reserves the right to freeze or investigate wallets where suspicious activity is detected.</li>
      </ul>

      <h2 style={h2Style}>15. Intellectual Property</h2>
      <p style={pStyle}>RoutePro trademarks, logos, designs, content, systems, and software remain the exclusive property of RoutePro and its licensors. Unauthorized use, reproduction, or distribution is strictly prohibited.</p>

      <h2 style={h2Style}>16. Data Privacy</h2>
      <p style={pStyle}>Personal information is handled in accordance with the <a href={`/${locale}/legal/privacy-policy`} style={{ color: '#16A34A', fontWeight: 600 }}>RoutePro Privacy Policy</a>. Users consent to data processing necessary for platform operations by using the platform.</p>

      <h2 style={h2Style}>17. Limitation of Liability</h2>
      <p style={pStyle}>RoutePro acts primarily as a technology platform facilitating interactions between users and service providers. To the maximum extent permitted by law, RoutePro shall not be liable for:</p>
      <ul style={ulStyle}>
        {['Indirect or consequential damages', 'Loss of profits or business interruption', 'Third-party conduct or failures', 'Vehicle defects or misrepresentations', 'Employment decisions made by third parties', 'Transport delays beyond reasonable control'].map(s => <li key={s} style={liStyle}>{s}</li>)}
      </ul>

      <h2 style={h2Style}>18. Termination</h2>
      <p style={pStyle}>RoutePro may suspend or terminate access for policy violations, fraud, illegal activities, security concerns, or provision of false information. Users may discontinue use at any time.</p>

      <h2 style={h2Style}>19. Changes to Terms</h2>
      <p style={pStyle}>RoutePro may modify these Terms and Conditions at any time. Updated versions become effective upon publication. Continued use of the platform constitutes acceptance of the revised terms.</p>

      <h2 style={h2Style}>20. Governing Law</h2>
      <p style={pStyle}>These Terms shall be governed by applicable laws within the jurisdictions where RoutePro operates, including Nigeria and any other jurisdictions where services are made available.</p>

      <h2 style={h2Style}>21. Contact</h2>
      <p style={pStyle}>For questions regarding these Terms and Conditions, please contact RoutePro Support through the official support channels available on the platform.</p>

      <h3 style={h3Style}>Related Policies</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          ['Privacy Policy', 'privacy-policy'],
          ['Refund & Cancellation', 'refund-policy'],
          ['Company Terms', 'company-terms'],
          ['Rental Terms', 'rental-terms'],
          ['Dealer Terms', 'dealer-terms'],
          ['Careers Terms', 'careers-terms'],
          ['Wallet Terms', 'wallet-terms'],
          ['Acceptable Use', 'acceptable-use-policy'],
        ].map(([label, path]) => (
          <a key={path} href={`/${locale}/legal/${path}`} style={{
            background: '#F1F5F9', color: '#334155', fontSize: 12, fontWeight: 600,
            padding: '6px 14px', borderRadius: 20, textDecoration: 'none',
            border: '1px solid #E2E8F0',
          }}>{label}</a>
        ))}
      </div>
    </LegalPageLayout>
  )
}
