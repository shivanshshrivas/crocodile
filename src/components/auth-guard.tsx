'use client'

// Simple bypass auth guard - always allows access
interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children }: AuthGuardProps) {
  // Always render children for bypass mode
  return <>{children}</>
}
