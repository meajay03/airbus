import React, { useState } from 'react'
import { X, Lock, Mail, User, Phone, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { User as UserType } from '../types/index'
import { LuxuryApiClient } from '../services/api'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  initialMode?: 'login' | 'register'
  onClose: () => void
  onAuthSuccess: (user: UserType, message: string) => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register Form State
  const [regFullName, setRegFullName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState<'guest' | 'host'>('guest')

  // Status State
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!isOpen) return null

  // Fast Demo Accounts matching Six Launch Roles
  const demoAccounts = [
    { label: 'Guest', email: 'guest@maisonvela.com', name: 'Aarav Singhania', role: 'guest' },
    { label: 'Host', email: 'host@maisonvela.com', name: 'Maharaja Vikramaditya', role: 'host' },
    { label: 'Property Mgr', email: 'manager@maisonvela.com', name: 'Devika Mehra', role: 'property_manager' },
    { label: 'Support Agent', email: 'support@maisonvela.com', name: 'Karan Malhotra', role: 'support_agent' },
    { label: 'Admin', email: 'admin@maisonvela.com', name: 'Platform Admin', role: 'admin' },
    { label: 'Super Admin', email: 'superadmin@maisonvela.com', name: 'Super Administrator', role: 'super_admin' },
  ]

  const handleQuickFill = (email: string) => {
    setMode('login')
    setLoginEmail(email)
    setLoginPassword('vela2026')
    setErrorMsg('')
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const res = await LuxuryApiClient.login({
        email: loginEmail.trim(),
        password: loginPassword
      })
      setSuccessMsg(res.message || 'Authenticated successfully')
      setTimeout(() => {
        onAuthSuccess(res.user, res.message)
        onClose()
      }, 500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const res = await LuxuryApiClient.register({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        role: regRole
      })
      setSuccessMsg(res.message || 'Privileged account created successfully')
      setTimeout(() => {
        onAuthSuccess(res.user, res.message)
        onClose()
      }, 600)
    } catch (err: any) {
      setErrorMsg(err.message || 'Account registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-card" onClick={e => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose} aria-label="Close authentication modal">
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <span>MV</span>
          </div>
          <span className="auth-eyebrow">MAISON VÉLA · SANCTUARY MEMBERSHIP</span>
          <h2 className="auth-title">
            {mode === 'login' ? 'Welcome Back to Maison Véla' : 'Privileged Membership Registration'}
          </h2>
          <p className="auth-desc">
            {mode === 'login'
              ? 'Access your bespoke itineraries, confirmed stays, and private homeowner portals.'
              : 'Join an exclusive community discovering extraordinary luxury villas and boutique estates.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg('') }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg('') }}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="auth-alert error">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="auth-alert success">
            <CheckCircle2 size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="auth-input-group">
              <label>Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={15} className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="e.g., guest@maisonvela.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-label-row">
                <label>Password</label>
                <span className="auth-helper-note">Default: vela2026</span>
              </div>
              <div className="auth-input-wrap">
                <Lock size={15} className="auth-input-icon" />
                <input
                  type="password"
                  placeholder="Enter your confidential password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              <span>{loading ? 'Authenticating with Secure Ledger...' : 'Sign In to Privileged Account'}</span>
              <ArrowRight size={14} />
            </button>

            {/* Demo Quick-Select Credentials */}
            <div className="auth-demo-section">
              <span className="auth-demo-label">ONE-CLICK DEMO AUTHENTICATION</span>
              <div className="auth-demo-grid">
                {demoAccounts.map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    className="auth-demo-chip"
                    onClick={() => handleQuickFill(acc.email)}
                    title={`Fill ${acc.name} credentials`}
                  >
                    <strong>{acc.label}</strong>
                    <small>{acc.name.split(' ')[0]}</small>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <div className="auth-input-group">
              <label>Full Legal Name</label>
              <div className="auth-input-wrap">
                <User size={15} className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="e.g., Aarav Singhania"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label>Confidential Email Address</label>
              <div className="auth-input-wrap">
                <Mail size={15} className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="e.g., yourname@domain.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-input-row">
              <div className="auth-input-group">
                <label>Phone / WhatsApp</label>
                <div className="auth-input-wrap">
                  <Phone size={15} className="auth-input-icon" />
                  <input
                    type="tel"
                    placeholder="+91 98201 00000"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Password (Min. 6 chars)</label>
                <div className="auth-input-wrap">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    type="password"
                    placeholder="Create password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="auth-input-group">
              <label>Intended Account Perspective</label>
              <div className="auth-role-cards">
                <div
                  className={`auth-role-card ${regRole === 'guest' ? 'selected' : ''}`}
                  onClick={() => setRegRole('guest')}
                >
                  <strong>Guest Traveler</strong>
                  <p>Discover, book, and enjoy curated luxury villas and suites.</p>
                </div>
                <div
                  className={`auth-role-card ${regRole === 'host' ? 'selected' : ''}`}
                  onClick={() => setRegRole('host')}
                >
                  <strong>Host / Property Owner</strong>
                  <p>Onboard and manage luxury properties, rates, and payouts.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              <span>{loading ? 'Creating Encrypted Identity...' : 'Create Maison Véla Account'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="auth-footer">
          <ShieldCheck size={14} color="#8c6d32" />
          <span>Encrypted with scrypt hash authentication & secure token sessions.</span>
        </div>
      </div>
    </div>
  )
}
