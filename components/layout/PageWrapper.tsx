'use client'

import { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  /**
   * Variant controls the entry animation.
   * 'default' → fadeInUp (most pages)
   * 'scale'   → fadeInScale (modals, panels)
   */
  variant?: 'default' | 'scale'
}

/**
 * PageWrapper
 *
 * Wraps every page with:
 * - A smooth fade-in / slide-up entry animation
 * - A consistent min-height so pages never look bare
 * - Overflow-x hidden to prevent any horizontal scroll bleed
 *
 * Usage:
 *   <PageWrapper>
 *     ...page content
 *   </PageWrapper>
 */
export default function PageWrapper({
  children,
  className = '',
  style = {},
  variant = 'default',
}: PageWrapperProps) {
  const animClass = variant === 'scale' ? 'fade-in-scale' : 'page-enter'

  return (
    <div
      className={`${animClass} ${className}`}
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
