import { Metadata } from 'next'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Acceptable Use Policy — RoutePro',
  description: 'RoutePro Community Standards and Acceptable Use Policy. Understand what behaviors are permitted and prohibited on the platform.',
}

interface Props { params: Promise<{ locale: string }> }

export default async function AcceptableUsePolicyPage({ params }: Props) {
  const { locale } = await params
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 36, marginBottom: 12, fontFamily: "'Outfit', sans-serif", borderLeft: '4px solid #16A34A', paddingLeft: 12 }
  const p: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, margin: '0 0 12px' }
  const ul: React.CSSProperties = { paddingLeft: 20, margin: '8px 0 16px' }
  const li: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 4 }

  return (
    <LegalPageLayout title="Acceptable Use Policy" subtitle="Community standards and prohibited conduct on the RoutePro platform." locale={locale} currentPath="acceptable-use-policy">

      <p style={{ ...p, background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 12, padding: '16px 20px', color: '#991B1B', fontWeight: 600 }}>
        Scope: All Users — This policy applies to every person who accesses or uses RoutePro.
      </p>

      <h2 style={h2}>1. Purpose</h2>
      <p style={p}>This Acceptable Use Policy defines the standards of behavior expected from all RoutePro users. It is designed to protect users, service providers, and the integrity of the platform.</p>

      <h2 style={h2}>2. Permitted Uses</h2>
      <ul style={ul}>
        <li style={li}>Searching for and booking legitimate transport services</li>
        <li style={li}>Listing genuine vehicles for sale or rent</li>
        <li style={li}>Registering a legitimate business or company</li>
        <li style={li}>Applying for careers or recruitment opportunities in good faith</li>
        <li style={li}>Leaving honest and fair reviews and ratings</li>
        <li style={li}>Using platform tools to manage your bookings and payments</li>
      </ul>

      <h2 style={h2}>3. Prohibited Conduct</h2>
      <p style={p}>The following actions are strictly prohibited and may result in immediate account suspension or permanent ban:</p>

      <h2 style={{ ...h2, fontSize: 14, color: '#DC2626', borderLeftColor: '#DC2626', marginTop: 16 }}>3a. Fraud & Misrepresentation</h2>
      <ul style={ul}>
        <li style={li}>Creating fake accounts or impersonating other users</li>
        <li style={li}>Submitting fraudulent booking or payment details</li>
        <li style={li}>Listing vehicles you do not own or are not authorized to sell/rent</li>
        <li style={li}>Providing false company registration documents</li>
        <li style={li}>Misrepresenting your identity, qualifications, or authority</li>
      </ul>

      <h2 style={{ ...h2, fontSize: 14, color: '#DC2626', borderLeftColor: '#DC2626', marginTop: 16 }}>3b. Harassment & Abuse</h2>
      <ul style={ul}>
        <li style={li}>Threatening, intimidating, or harassing other users, drivers, or staff</li>
        <li style={li}>Using hateful, discriminatory, or offensive language</li>
        <li style={li}>Making unwanted sexual, racial, or political remarks</li>
        <li style={li}>Encouraging others to violate platform policies</li>
      </ul>

      <h2 style={{ ...h2, fontSize: 14, color: '#DC2626', borderLeftColor: '#DC2626', marginTop: 16 }}>3c. System Abuse</h2>
      <ul style={ul}>
        <li style={li}>Attempting to gain unauthorized access to accounts or systems</li>
        <li style={li}>Uploading or transmitting malware, viruses, or harmful code</li>
        <li style={li}>Scraping, crawling, or extracting platform data without authorization</li>
        <li style={li}>Attempting to reverse engineer or decompile the platform</li>
        <li style={li}>Manipulating reviews, ratings, or search results artificially</li>
      </ul>

      <h2 style={{ ...h2, fontSize: 14, color: '#DC2626', borderLeftColor: '#DC2626', marginTop: 16 }}>3d. Payment Abuse</h2>
      <ul style={ul}>
        <li style={li}>Filing false chargebacks or fraudulent refund claims</li>
        <li style={li}>Using stolen payment credentials</li>
        <li style={li}>Conducting unauthorized money transfers</li>
        <li style={li}>Attempting to circumvent platform payment systems</li>
      </ul>

      <h2 style={h2}>4. Review & Rating Standards</h2>
      <ul style={ul}>
        <li style={li}>All reviews must be based on genuine, first-hand experiences.</li>
        <li style={li}>Fake reviews, incentivized reviews, or competitor sabotage are prohibited.</li>
        <li style={li}>Reviews containing personal attacks, threats, or unverifiable claims will be removed.</li>
      </ul>

      <h2 style={h2}>5. Reporting Violations</h2>
      <p style={p}>If you observe a violation of this policy, please report it immediately through the Help Center. RoutePro investigates all reports and takes appropriate action.</p>

      <h2 style={h2}>6. Consequences of Violations</h2>
      <ul style={ul}>
        <li style={li}><strong>Warning:</strong> First-time minor violations may receive a formal warning.</li>
        <li style={li}><strong>Suspension:</strong> Repeated or moderate violations may result in temporary account suspension.</li>
        <li style={li}><strong>Permanent Ban:</strong> Serious violations, fraud, or illegal conduct will result in permanent account termination.</li>
        <li style={li}><strong>Legal Action:</strong> Criminal or civil proceedings may be pursued for severe violations.</li>
      </ul>

      <h2 style={h2}>7. Updates to This Policy</h2>
      <p style={p}>RoutePro may update this Acceptable Use Policy as the platform evolves. Users are encouraged to review it periodically.</p>
    </LegalPageLayout>
  )
}
