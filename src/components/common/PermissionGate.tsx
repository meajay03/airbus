import React from 'react'
import { useAuth } from '../../context/AuthContext'
import { PlatformRole } from '../../types'

interface PermissionGateProps {
  children: React.ReactNode
  permission?: string
  role?: PlatformRole | string
  fallback?: React.ReactNode
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  role,
  fallback = null
}) => {
  const { hasPermission, hasRole } = useAuth()

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
