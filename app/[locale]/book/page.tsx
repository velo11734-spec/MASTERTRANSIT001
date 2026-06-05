'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BookPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/en/search') }, [])
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Outfit, sans-serif' }}>
      <p style={{ color: '#64748B' }}>Redirecting to search...</p>
    </div>
  )
}
