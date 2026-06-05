'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const steps = [
    { name: 'Business Info', path: '/company/onboarding/step-1' },
    { name: 'Office & Contact', path: '/company/onboarding/step-2' },
    { name: 'Identity Verification', path: '/company/onboarding/step-3' },
    { name: 'Banking Info', path: '/company/onboarding/step-4' },
    { name: 'Vehicle Docs', path: '/company/onboarding/step-5' },
    { name: 'Review & Submit', path: '/company/onboarding/step-6' },
  ];
  const currentIndex = steps.findIndex(s => pathname?.includes(s.path));

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
      <nav className="flex space-x-2 mb-6 justify-center">
        {steps.map((step, idx) => (
          <Link
            key={step.name}
            href={step.path}
            className={`px-4 py-2 rounded-full transition-colors ${idx <= currentIndex ? 'bg-indigo-600' : 'bg-gray-700'} ${idx === currentIndex ? 'font-bold' : ''}`}
          >
            {step.name}
          </Link>
        ))}
      </nav>
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg max-w-4xl mx-auto">
        {children}
      </div>
    </section>
  );
}
