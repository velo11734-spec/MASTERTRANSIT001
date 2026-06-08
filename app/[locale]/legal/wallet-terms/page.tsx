import { Metadata } from 'next'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Payment & Wallet Terms — RoutePro',
  description: 'Terms governing payments, wallet transactions, withdrawal tiers, and financial operations on the RoutePro platform.',
}

interface Props { params: Promise<{ locale: string }> }

export default async function WalletTermsPage({ params }: Props) {
  const { locale } = await params
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 36, marginBottom: 12, fontFamily: "'Outfit', sans-serif", borderLeft: '4px solid #2563EB', paddingLeft: 12 }
  const p: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, margin: '0 0 12px' }
  const ul: React.CSSProperties = { paddingLeft: 20, margin: '8px 0 16px' }
  const li: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 4 }

  return (
    <LegalPageLayout title="Payment & Wallet Terms" subtitle="Terms governing all payments, the dual-balance wallet functionality, withdrawal tiers, and financial transactions on RoutePro." locale={locale} currentPath="wallet-terms">
      <p style={{ ...p, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '16px 20px', color: '#1E40AF', fontWeight: 600 }}>
        Scope: All Users — Passengers, Companies, Dealers, and Rental Providers
      </p>

      <h2 style={h2}>1. Accepted Payment Methods</h2>
      <ul style={ul}>
        <li style={li}>Debit and credit cards (Visa, Mastercard, Verve)</li>
        <li style={li}>Bank transfers</li>
        <li style={li}>RoutePro Wallet (Spendable and Refund balances)</li>
        <li style={li}>Supported mobile payment and USSD options</li>
        <li style={li}>Approved payment gateways (e.g., Paystack)</li>
      </ul>

      <h2 style={h2}>2. Dual-Balance Wallet Architecture</h2>
      <p style={p}>The RoutePro Wallet is a stored-value account divided into two distinct balances:</p>
      <ul style={ul}>
        <li style={li}><strong>Spendable Balance:</strong> Funds added directly by the user via card or bank transfer. These funds can be used for bookings, rentals, marketplace purchases, or withdrawn subject to our Tiered Withdrawal Policy.</li>
        <li style={li}><strong>Refund Balance (Escrow):</strong> Funds issued as refunds for canceled trips, promotional credits, or compensation. <strong>Refund balances cannot be withdrawn to a bank account.</strong> They must be used for subsequent bookings or services within the RoutePro ecosystem.</li>
      </ul>

      <h2 style={h2}>3. Tiered Withdrawal Policy</h2>
      <p style={p}>To ensure platform sustainability and security, withdrawals from your Spendable Balance are processed according to the following dynamic tiers:</p>
      <ul style={ul}>
        <li style={li}><strong>Tier 1 - Small Balances (₦0 - ₦50,000):</strong> Automatic bank withdrawals are NOT allowed. These funds must be used for subsequent bookings or platform services to maintain ecosystem liquidity.</li>
        <li style={li}><strong>Tier 2 - Medium Balances (₦50,001 - ₦250,000):</strong> Withdrawals to a registered bank account are allowed and processed automatically. A standard withdrawal processing fee may apply.</li>
        <li style={li}><strong>Tier 3 - High Balances (₦250,001+):</strong> Withdrawals are permitted with zero withdrawal fees. However, to prevent fraud, these transactions require manual administrative approval and multi-factor authentication (OTP verification). Processing may take 1-3 business days.</li>
      </ul>

      <h2 style={h2}>4. Escrow and Cancellation Refunds</h2>
      <ul style={ul}>
        <li style={li}>When a user cancels a trip or service, the refund is automatically deposited into their <strong>Refund Balance</strong>.</li>
        <li style={li}>Refunds are <strong>never</strong> processed directly back to the user's bank account or payment card in order to avoid external payment gateway fees.</li>
        <li style={li}>Refund Balances do not expire but are strictly non-withdrawable.</li>
      </ul>

      <h2 style={h2}>5. Transaction Fees</h2>
      <ul style={ul}>
        <li style={li}>Platform service fees are applied to certain bookings and transactions.</li>
        <li style={li}>Payment processing fees from payment partners may be passed to users during wallet top-ups.</li>
        <li style={li}>Tier 2 withdrawals may incur processing fees.</li>
      </ul>

      <h2 style={h2}>6. Authorization & Funding</h2>
      <p style={p}>By initiating any payment or wallet top-up on RoutePro, you authorize RoutePro to charge your selected payment method. You confirm that you are authorized to use the payment method provided. The minimum wallet top-up amount is generally ₦500 but may be adjusted by administration.</p>

      <h2 style={h2}>7. Fraud Prevention & Suspicious Activity</h2>
      <ul style={ul}>
        <li style={li}>RoutePro actively monitors transactions for fraud, money laundering, and suspicious activity.</li>
        <li style={li}>Wallets associated with suspected fraud may be frozen pending investigation without prior notice.</li>
        <li style={li}>Users must report unauthorized transactions immediately through the Help Center.</li>
      </ul>

      <h2 style={h2}>8. Chargebacks</h2>
      <ul style={ul}>
        <li style={li}>Filing a chargeback without first attempting to resolve the issue through RoutePro is a violation of these terms and may lead to immediate account suspension.</li>
        <li style={li}>RoutePro will aggressively respond to all legitimate chargeback disputes with relevant transaction and wallet audit logs.</li>
      </ul>

      <h2 style={h2}>9. Changes to Payment Terms</h2>
      <p style={p}>RoutePro reserves the right to modify payment methods, fee structures, minimum funding thresholds, and withdrawal tier limits at any time. Active users will be notified of significant changes via email or dashboard notifications.</p>
    </LegalPageLayout>
  )
}
