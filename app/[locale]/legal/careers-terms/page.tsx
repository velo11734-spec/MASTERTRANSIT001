import { Metadata } from 'next'
import LegalPageLayout from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Careers & Applicant Terms — RoutePro',
  description: 'Terms governing job applications, recruitment, and career opportunities through the RoutePro platform.',
}

interface Props { params: Promise<{ locale: string }> }

export default async function CareersTermsPage({ params }: Props) {
  const { locale } = await params
  const h2: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 36, marginBottom: 12, fontFamily: "'Outfit', sans-serif", borderLeft: '4px solid #EC4899', paddingLeft: 12 }
  const p: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, margin: '0 0 12px' }
  const ul: React.CSSProperties = { paddingLeft: 20, margin: '8px 0 16px' }
  const li: React.CSSProperties = { fontSize: 14, color: '#475569', lineHeight: 1.8, marginBottom: 4 }

  return (
    <LegalPageLayout title="Careers & Applicant Terms" subtitle="Terms and conditions for job seekers, applicants, and employers using RoutePro's recruitment and careers platform." locale={locale} currentPath="careers-terms">
      <p style={{ ...p, background: '#FDF2F8', border: '1px solid #FBCFE8', borderRadius: 12, padding: '16px 20px', color: '#831843', fontWeight: 600 }}>
        Scope: Job Applicants, Candidates, and Employers using RoutePro Careers
      </p>

      <h2 style={h2}>1. Purpose of RoutePro Careers</h2>
      <p style={p}>RoutePro Careers is a facilitation platform that connects job seekers with employment opportunities offered by RoutePro and its transport partners. RoutePro does not guarantee employment, interviews, or job offers for any applicant.</p>

      <h2 style={h2}>2. Applicant Eligibility</h2>
      <ul style={ul}>
        <li style={li}>Applicants must be legally eligible to work in the jurisdiction of the advertised role.</li>
        <li style={li}>Applicants must be of the minimum legal working age in their jurisdiction.</li>
        <li style={li}>Applicants must not have been prohibited by law from working in the relevant field.</li>
      </ul>

      <h2 style={h2}>3. Applicant Obligations</h2>
      <ul style={ul}>
        <li style={li}>All information submitted in applications must be truthful and accurate.</li>
        <li style={li}>CVs, qualifications, and reference details must be genuine and verifiable.</li>
        <li style={li}>Applicants who provide false information may be permanently disqualified and reported to relevant authorities.</li>
        <li style={li}>Applicants must maintain professionalism throughout all application and interview processes.</li>
      </ul>

      <h2 style={h2}>4. Employer Obligations</h2>
      <ul style={ul}>
        <li style={li}>Employers must list genuine, legal job opportunities.</li>
        <li style={li}>Job descriptions must be accurate and not misleading.</li>
        <li style={li}>Employers must conduct recruitment in compliance with applicable employment laws.</li>
        <li style={li}>Employers must not request payment from applicants as a condition of employment.</li>
        <li style={li}>Discrimination on the basis of gender, ethnicity, religion, disability, or other protected characteristics is prohibited.</li>
      </ul>

      <h2 style={h2}>5. No Guarantee of Employment</h2>
      <p style={p}>RoutePro does not guarantee job placement, interview invitations, or successful hiring outcomes for any applicant. The recruitment decision rests solely with the hiring company or employer.</p>

      <h2 style={h2}>6. Data Use for Recruitment</h2>
      <ul style={ul}>
        <li style={li}>Application data (CV, cover letter, profile) is shared with relevant employers.</li>
        <li style={li}>RoutePro does not sell applicant data to unrelated third parties.</li>
        <li style={li}>Applicants may withdraw their applications and request data deletion at any time.</li>
      </ul>

      <h2 style={h2}>7. Driver Recruitment</h2>
      <ul style={ul}>
        <li style={li}>Drivers applying through RoutePro must hold valid, appropriate driving licenses.</li>
        <li style={li}>Drivers consent to background checks as required by transport operators.</li>
        <li style={li}>False information in driver applications may result in immediate disqualification.</li>
      </ul>

      <h2 style={h2}>8. Prohibited Recruitment Practices</h2>
      <ul style={ul}>
        <li style={li}>Posting fraudulent job listings</li>
        <li style={li}>Requesting money or gifts from applicants</li>
        <li style={li}>Using the platform to harvest personal data for non-recruitment purposes</li>
        <li style={li}>Discriminatory hiring practices</li>
      </ul>

      <h2 style={h2}>9. Reporting Issues</h2>
      <p style={p}>If you encounter suspicious job listings, fraudulent employers, or inappropriate conduct during the recruitment process, report it immediately through the RoutePro Help Center.</p>
    </LegalPageLayout>
  )
}
