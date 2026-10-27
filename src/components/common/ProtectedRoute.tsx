import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PlatformRole } from '../../types'
import { ShieldAlert, Lock } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: PlatformRole | string
  requiredPermission?: string
  fallbackRoute?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackRoute = '/'
}) => {
  const { currentUser, loading, hasRole, hasPermission } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: 'var(--muted)', fontSize: '13px' }}>
        Verifying cryptographic session & permissions...
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to={fallbackRoute} replace />
  }

  if (currentUser.status === 'suspended') {
    return (
      <div style={{ maxWidth: '540px', margin: '80px auto', padding: '36px', background: '#fff', border: '1px solid #fecdd3', textAlign: 'center' }}>
        <ShieldAlert size={42} color="#e11d48" style={{ marginBottom: '16px' }} />
        <h2 style={{ font: '500 22px var(--serif)', color: '#9f1239', margin: '0 0 10px' }}>Account Suspended</h2>
        <p style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          Your access has been restricted under platform governance policies. If you believe this is in error, please contact marketplace administration.
        </p>
      </div>
    )
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div style={{ maxWidth: '540px', margin: '80px auto', padding: '36px', background: '#fff', border: '1px solid var(--line)', textAlign: 'center' }}>
        <Lock size={36} color="var(--gold-dark)" style={{ marginBottom: '16px' }} />
        <h2 style={{ font: '500 22px var(--serif)', margin: '0 0 10px' }}>Restricted Privilege Level</h2>
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
          This portal requires role privilege: <strong>{String(requiredRole).toUpperCase()}</strong>. Your current role is <strong>{currentUser.role.toUpperCase()}</strong>.
        </p>
        <a href="/" style={{ display: 'inline-block', background: 'var(--charcoal)', color: '#fff', padding: '10px 20px', fontSize: '11px', textDecoration: 'none' }}>
          Return to Marketplace
        </a>
      </div>
    )
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div style={{ maxWidth: '540px', margin: '80px auto', padding: '36px', background: '#fff', border: '1px solid var(--line)', textAlign: 'center' }}>
        <Lock size={36} color="var(--gold-dark)" style={{ marginBottom: '16px' }} />
        <h2 style={{ font: '500 22px var(--serif)', margin: '0 0 10px' }}>Authorization Required</h2>
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '24px' }}>
          Your account does not hold the granular privilege: <code>{requiredPermission}</code>.
        </p>
        <a href="/" style={{ display: 'inline-block', background: 'var(--charcoal)', color: '#fff', padding: '10px 20px', fontSize: '11px', textDecoration: 'none' }}>
          Return to Marketplace
        </a>
      </div>
    )
  }

  return <>{children}</>
}
