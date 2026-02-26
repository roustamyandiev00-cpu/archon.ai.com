'use client'

import { useEffect } from 'react'

/**
 * Announces messages to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Hook for managing focus within a component
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return
    
    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
    
    // Focus first element
    firstElement?.focus()
    
    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  }, [isActive, containerRef])
}

/**
 * Skip link component for keyboard navigation
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
    >
      Overslaan naar hoofdinhoud
    </a>
  )
}

/**
 * Visually hidden text for screen readers
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

/**
 * Error message component with proper ARIA attributes
 */
export function ErrorMessage({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} className="text-sm text-red-600" role="alert">
      {children}
    </span>
  )
}

/**
 * Loading state announcement
 */
export function LoadingAnnouncer({ isLoading, message = 'Laden...' }: { isLoading: boolean; message?: string }) {
  useEffect(() => {
    if (isLoading) {
      announce(message, 'polite')
    }
  }, [isLoading, message])
  
  return null
}

/**
 * Page title announcer for route changes
 */
export function PageTitleAnnouncer({ title }: { title: string }) {
  useEffect(() => {
    if (title) {
      announce(`Pagina geladen: ${title}`, 'polite')
    }
  }, [title])
  
  return null
}
