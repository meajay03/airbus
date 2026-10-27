import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, PlatformRole } from '../types/index'
import { LuxuryApiClient, getAuthToken, clearAuthSession, setAuthToken, setStoredUser, getStoredUser } from '../services/api'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
  hasRole: (role: PlatformRole | string) => boolean
  login: (payload: { email: string; password: string }) => Promise<void>
  register: (payload: { email: string; fullName: string; password?: string; phone?: string; role?: any }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  switchPerspective: (role: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser())
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    const token = getAuthToken()
    if (!token) {
      setCurrentUser(null)
      setLoading(false)
      return
    }

    try {
      const data = await LuxuryApiClient.getMe()
      if (data?.user) {
        setCurrentUser(data.user)
        setStoredUser(data.user)
      } else {
        clearAuthSession()
        setCurrentUser(null)
      }
    } catch {
      // Offline fallback: keep stored user if valid
      const stored = getStoredUser()
      if (stored) {
        setCurrentUser(stored)
      } else {
        clearAuthSession()
        setCurrentUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false
    if (currentUser.role === 'super_admin' || currentUser.roles?.includes('super_admin')) {
      return true
    }
    return currentUser.permissions?.includes(permission) || false
  }

  const hasRole = (role: PlatformRole | string): boolean => {
    if (!currentUser) return false
    if (currentUser.role === 'super_admin' || currentUser.roles?.includes('super_admin')) {
      return true
    }
    return currentUser.role === role || (currentUser.roles?.includes(role) ?? false)
  }

  const login = async (payload: { email: string; password: string }) => {
    const res = await LuxuryApiClient.login(payload)
    if (res.user) {
      setCurrentUser(res.user)
      setStoredUser(res.user)
    }
  }

  const register = async (payload: { email: string; fullName: string; password?: string; phone?: string; role?: any }) => {
    const res = await LuxuryApiClient.register(payload)
    if (res.user) {
      setCurrentUser(res.user)
      setStoredUser(res.user)
    }
  }

  const logout = async () => {
    try {
      await LuxuryApiClient.logout()
    } catch {}
    clearAuthSession()
    setCurrentUser(null)
  }

  const switchPerspective = async (role: string) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      const data = await res.json()
      if (data.user) {
        setCurrentUser(data.user)
        setStoredUser(data.user)
        if (data.token) setAuthToken(data.token)
      }
    } catch {}
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated: !!currentUser,
        hasPermission,
        hasRole,
        login,
        register,
        logout,
        refreshUser,
        switchPerspective
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
