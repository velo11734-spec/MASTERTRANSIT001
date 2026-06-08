import { Metadata } from 'next'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Vehicle Dealer Terms — RoutePro',
  description: 'Terms governing vehicle dealers and sellers listing vehicles on the RoutePro marketplace.',
}

interface Props { params: Promise<{ locale: string }> }

export default async function DealerTermsPage({ params }: Props) {
  const { locale } = await params
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 36, marginBottom: 12, fontFamily: "'Outfit', sans-serif", borderLeft: '4px solid #7C3AED', paddingLeft: 12 }
  const p: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, margin: '0 0 12px' }
  const ul: React.CSSProperties = { paddingLeft: 20, margin: '8px 0 16px' }
  const li: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 4 }

  return (
    <LegalPageLayout title="Vehicle Dealer Terms" subtitle="Terms governing the listing, sale, and representation of vehicles by dealers on the RoutePro Marketplace." locale={locale} currentPath="dealer-terms">
      <p style={{ ...p, background: '#EDE9FE', border: '1px solid #DDD6FE', borderRadius: 12, padding: '16px 20px', color: '#4C1D95', fontWeight: 600 }}>
        Scope: Individual Sellers and Authorized Dealers listing vehicles for sale on RoutePro
      </p>

      <h2 style={h2}>1. Dealer Eligibility</h2>
      <ul style={ul}>
        <li style={li}>Dealers must be legally authorized to sell the vehicles they list.</li>
        <li style={li}>Individual sellers must be the registered owner or have legal authority to sell.</li>
        <li style={li}>Dealers operating as businesses must provide company registration documents.</li>
        <li style={li}>Dealers must comply with all applicable vehicle sale regulations in their jurisdiction.</li>
      </ul>

      <h2 style={h2}>2. Listing Accuracy</h2>
      <ul style={ul}>
        <li style={li}>All vehicle details must be truthful: make, model, year, mileage, condition, and asking price.</li>
        <li style={li}>Photos must be authentic, current, and representative of the actual vehicle.</li>
        <li style={li}>Any defects, mechanical issues, accident history, or outstanding finance must be disclosed.</li>
        <li style={li}>VIN (Vehicle Identification Number) must be accurate where required.</li>
        <li style={li}>Misleading listings will be removed and may result in account suspension.</li>
      </ul>

      <h2 style={h2}>3. Vehicle Ownership & Legality</h2>
      <ul style={ul}>
        <li style={li}>Dealers guarantee that listed vehicles are free of encumbrances unless disclosed.</li>
        <li style={li}>Stolen, impounded, or otherwise legally restricted vehicles must not be listed.</li>
        <li style={li}>RoutePro may request proof of ownership at any time.</li>
      </ul>

      <h2 style={h2}>4. Transactions</h2>
      <ul style={ul}>
        <li style={li}>RoutePro acts as a marketplace platform and is not a party to vehicle sale contracts.</li>
        <li style={li}>Sales are transacted between buyers and sellers directly or through RoutePro's facilitated transaction system.</li>
        <li style={li}>Dealers must not solicit buyers to transact outside RoutePro for platform-introduced leads.</li>
        <li style={li}>All prices advertised must be in Nigerian Naira (NGN) or the local currency of operation.</li>
      </ul>

      <h2 style={h2}>5. Buyer Protection</h2>
      <ul style={ul}>
        <li style={li}>Buyers are encouraged to inspect vehicles before completing a purchase.</li>
        <li style={li}>RoutePro does not guarantee vehicle condition or seller representations.</li>
        <li style={li}>Documented misrepresentation may qualify for a dispute and potential refund.</li>
        <li style={li}>Disputes must be raised within 7 days of the agreed transaction date.</li>
      </ul>

      <h2 style={h2}>6. Platform Fees</h2>
      <ul style={ul}>
        <li style={li}>Listing fees, promotion fees, and transaction fees may apply depending on the dealer plan.</li>
        <li style={li}>Fee structures are displayed in the dealer dashboard and may change with notice.</li>
      </ul>

      <h2 style={h2}>7. Prohibited Listings</h2>
      <ul style={ul}>
        <li style={li}>Stolen vehicles or vehicles with forged documents</li>
        <li style={li}>Vehicles not legally roadworthy without clear disclosure</li>
        <li style={li}>Vehicles with outstanding finance without clear disclosure</li>
        <li style={li}>Replica or counterfeit vehicles misrepresented as genuine</li>
        <li style={li}>Vehicles listed at prices intended to deceive (bait-and-switch)</li>
      </ul>

      <h2 style={h2}>8. Enforcement</h2>
      <p style={p}>RoutePro may remove listings, suspend accounts, or refer dealers to relevant authorities for violations of these terms or applicable law.</p>
    </LegalPageLayout>
  )
}
