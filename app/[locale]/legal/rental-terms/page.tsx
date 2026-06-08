import { Metadata } from 'next'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Rental Provider Terms — RoutePro',
  description: 'Terms and conditions for vehicle rental providers offering vehicles through the RoutePro platform.',
}

interface Props { params: Promise<{ locale: string }> }

export default async function RentalTermsPage({ params }: Props) {
  const { locale } = await params
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 36, marginBottom: 12, fontFamily: "'Outfit', sans-serif", borderLeft: '4px solid #0891B2', paddingLeft: 12 }
  const p: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, margin: '0 0 12px' }
  const ul: React.CSSProperties = { paddingLeft: 20, margin: '8px 0 16px' }
  const li: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 4 }

  return (
    <LegalPageLayout title="Rental Provider Terms" subtitle="Terms governing vehicle rental providers and customers using RoutePro's rental marketplace." locale={locale} currentPath="rental-terms">
      <p style={{ ...p, background: '#E0F2FE', border: '1px solid #BAE6FD', borderRadius: 12, padding: '16px 20px', color: '#0C4A6E', fontWeight: 600 }}>
        Scope: Rental Providers listing vehicles, and Users renting vehicles through RoutePro
      </p>

      <h2 style={h2}>1. Listing Requirements (Providers)</h2>
      <ul style={ul}>
        <li style={li}>Vehicles must be legally registered and owned or authorized for listing by the provider.</li>
        <li style={li}>All listings must accurately describe the vehicle, its condition, mileage, and features.</li>
        <li style={li}>Providers must disclose any known defects or limitations.</li>
        <li style={li}>Vehicle photos must be authentic and current.</li>
        <li style={li}>Pricing must include all mandatory fees; hidden charges are prohibited.</li>
      </ul>

      <h2 style={h2}>2. Provider Obligations</h2>
      <ul style={ul}>
        <li style={li}>Ensure vehicles are clean, fueled, and road-ready at the time of handover.</li>
        <li style={li}>Provide a valid insurance document covering the rental period.</li>
        <li style={li}>Be available or designate a contact for handover and return.</li>
        <li style={li}>Respond to booking requests within 24 hours.</li>
        <li style={li}>Communicate trip availability changes promptly.</li>
      </ul>

      <h2 style={h2}>3. Renter Obligations</h2>
      <ul style={ul}>
        <li style={li}>Renters must hold a valid driving license appropriate to the vehicle class.</li>
        <li style={li}>Renters must operate the vehicle lawfully and responsibly.</li>
        <li style={li}>Vehicles must not be used for illegal activities, racing, or subletting.</li>
        <li style={li}>Renters are liable for all fines, penalties, or violations incurred during the rental period.</li>
        <li style={li}>Vehicles must be returned on time, clean, and in the same condition as received.</li>
      </ul>

      <h2 style={h2}>4. Security Deposits</h2>
      <ul style={ul}>
        <li style={li}>Rental providers may require a security deposit determined at their discretion.</li>
        <li style={li}>Deposits are held and released upon satisfactory vehicle return.</li>
        <li style={li}>Deductions may be made for documented damage, excessive cleaning, or late returns.</li>
        <li style={li}>Disputes over deposit deductions are handled through RoutePro's dispute process.</li>
      </ul>

      <h2 style={h2}>5. Damage & Insurance</h2>
      <ul style={ul}>
        <li style={li}>Renters are responsible for damage caused during the rental period beyond normal wear and tear.</li>
        <li style={li}>Renters must report any accidents or damage immediately.</li>
        <li style={li}>Providers must carry valid vehicle insurance; RoutePro is not an insurer.</li>
        <li style={li}>RoutePro may offer optional rental protection — see platform for details.</li>
      </ul>

      <h2 style={h2}>6. Cancellations</h2>
      <p style={p}>See the full <a href={`/${locale}/legal/refund-policy`} style={{ color: '#0891B2', fontWeight: 600 }}>Refund & Cancellation Policy</a> for rental cancellation timelines and refund eligibility.</p>

      <h2 style={h2}>7. Platform Commission</h2>
      <ul style={ul}>
        <li style={li}>RoutePro charges a commission on rental transactions processed through the platform.</li>
        <li style={li}>Commission rates are available in the provider dashboard.</li>
        <li style={li}>Providers may not solicit renters to transact outside RoutePro to avoid commissions.</li>
      </ul>

      <h2 style={h2}>8. Suspension of Listings</h2>
      <p style={p}>RoutePro may remove or suspend rental listings that receive consistent complaints, contain inaccurate information, or violate platform policies.</p>
    </LegalPageLayout>
  )
}
