import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sparkles, User, Menu, X, Shield, Building, Wrench, LogOut } from 'lucide-react'
import { User as UserType } from '../types/index'
import { AccountMenu } from './navigation/AccountMenu'
import './Header.css'

interface HeaderProps {
  currentRole: 'guest' | 'owner' | 'admin' | 'manager'
  onSwitchRole: (role: 'guest' | 'owner' | 'admin' | 'manager') => void
  currentView?: string
  onNavigate?: (view: any) => void
  wishlistCount: number
  onOpenAIConcierge: () => void
  onOpenWishlist: () => void
  currentUser?: UserType | null
  onOpenAuthModal: (mode?: 'login' | 'register') => void
  onLogout: () => void
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSwitchRole,
  onNavigate,
  wishlistCount,
  onOpenAIConcierge,
  onOpenWishlist,
  currentUser,
  onOpenAuthModal,
  onLogout
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const rolesList: { role: 'guest' | 'owner' | 'manager' | 'admin'; label: string; icon: any; route: string }[] = [
    { role: 'guest', label: 'Guest (Aarav Singhania)', icon: User, route: '/guest/dashboard' },
    { role: 'owner', label: 'Owner (Maharaja Vikramaditya)', icon: Building, route: '/owner/portal' },
    { role: 'manager', label: 'Operations (Devika Mehra)', icon: Wrench, route: '/operations/hub' },
    { role: 'admin', label: 'Admin (Véla Executive)', icon: Shield, route: '/admin' }
  ]

  const goTo = (path: string, viewName?: string) => {
    navigate(path)
    if (onNavigate && viewName) onNavigate(viewName)
    setMobileMenuOpen(false)
  }

  const isCurrent = (path: string) => location.pathname === path

  return (
    <>
      <div className="site-header-wrapper">
        <header className="site-header">
        <button
          className="brand"
          onClick={() => goTo('/', 'home')}
          aria-label="Maison Véla home"
        >
          <span className="brand-mark">
            M<span>V</span>
          </span>
          <span className="brand-name">
            MAISON VÉLA
            <small>EXTRAORDINARY STAYS</small>
          </span>
        </button>

        <nav className="main-nav" aria-label="Main navigation">
          <button
            className={isCurrent('/explore') ? 'active-nav' : ''}
            onClick={() => goTo('/explore', 'explore')}
          >
            The Collection
          </button>
          <button
            className={isCurrent('/') ? 'active-nav' : ''}
            onClick={() => goTo('/', 'home')}
          >
            Destinations
          </button>

          {/* Become a Host link for guests and prospective partners */}
          {currentRole !== 'owner' && !isCurrent('/owner/portal') && (
            <button
              className={isCurrent('/become-a-host') ? 'active-nav' : ''}
              onClick={() => goTo('/become-a-host', 'become-a-host')}
            >
              Become a Host
            </button>
          )}

          {/* Dynamic role-based portal link */}
          {currentRole === 'guest' && !isCurrent('/owner/portal') && (
            <button
              className={isCurrent('/guest/dashboard') ? 'active-nav' : ''}
              onClick={() => goTo('/guest/dashboard', 'guest-dashboard')}
            >
              My Stays
            </button>
          )}

          {/* Owner Portal: explicitly active on /owner/portal or when role is owner */}
          {(currentRole === 'owner' || isCurrent('/owner/portal')) && (
            <button
              className={isCurrent('/owner/portal') ? 'active-nav' : ''}
              onClick={() => {
                onSwitchRole('owner')
                goTo('/owner/portal', 'owner-dashboard')
              }}
            >
              Owner Portal
            </button>
          )}
          {currentRole === 'manager' && (
            <button
              className={isCurrent('/operations/hub') ? 'active-nav' : ''}
              onClick={() => goTo('/operations/hub', 'operations')}
            >
              Operations Hub
            </button>
          )}
          {(currentRole === 'admin' || isCurrent('/admin') || isCurrent('/admin/dashboard')) && (
            <button
              className={isCurrent('/admin') || isCurrent('/admin/dashboard') ? 'active-nav' : ''}
              onClick={() => {
                onSwitchRole('admin')
                goTo('/admin', 'admin-dashboard')
              }}
            >
              Admin Center
            </button>
          )}
        </nav>

        <div className="header-actions">
          {/* AI Travel Concierge Assistant */}
          <button
            className="ai-assistant-btn"
            onClick={onOpenAIConcierge}
            title="Ask AI Luxury Travel Concierge"
          >
            <Sparkles size={14} color="#f5eedf" />
            <span className="ai-btn-text">AI Concierge</span>
          </button>

          {/* Dynamic Role-Aware Account Menu */}
          <AccountMenu
            currentUser={currentUser}
            onOpenAuthModal={onOpenAuthModal}
            onOpenWishlist={onOpenWishlist}
            wishlistCount={wishlistCount}
            onLogout={onLogout}
          />

          {/* Mobile hamburger menu toggle */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
    </div>

      {/* MOBILE DRAWER / SLIDE-DOWN NAVIGATION */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="brand-name">
                MAISON VÉLA
                <small>EXTRAORDINARY STAYS</small>
              </span>
              <button
                className="mobile-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mobile-nav-links">
              <button
                className={`mobile-nav-link ${isCurrent('/explore') ? 'active' : ''}`}
                onClick={() => goTo('/explore', 'explore')}
              >
                The Collection
              </button>
              <button
                className={`mobile-nav-link ${isCurrent('/') ? 'active' : ''}`}
                onClick={() => goTo('/', 'home')}
              >
                Destinations
              </button>
              {currentRole !== 'owner' && !isCurrent('/owner/portal') && (
                <button
                  className={`mobile-nav-link ${isCurrent('/become-a-host') ? 'active' : ''}`}
                  onClick={() => goTo('/become-a-host', 'become-a-host')}
                >
                  Become a Host
                </button>
              )}
            </div>

            <div className="mobile-drawer-divider" />

            {/* Role-specific Quick Links */}
            <div className="mobile-nav-section-title">ACTIVE PORTAL ({currentRole.toUpperCase()})</div>
            <div className="mobile-nav-links">
              {currentRole === 'guest' && !isCurrent('/owner/portal') && (
                <button
                  className={`mobile-nav-link ${isCurrent('/guest/dashboard') ? 'active' : ''}`}
                  onClick={() => goTo('/guest/dashboard', 'guest-dashboard')}
                >
                  My Reservations & Messages
                </button>
              )}
              {(currentRole === 'owner' || isCurrent('/owner/portal')) && (
                <button
                  className={`mobile-nav-link ${isCurrent('/owner/portal') ? 'active' : ''}`}
                  onClick={() => {
                    onSwitchRole('owner')
                    goTo('/owner/portal', 'owner-dashboard')
                  }}
                >
                  Owner Portal (Portfolio & Earnings)
                </button>
              )}
              {currentRole === 'manager' && (
                <button
                  className={`mobile-nav-link ${isCurrent('/operations/hub') ? 'active' : ''}`}
                  onClick={() => goTo('/operations/hub', 'operations')}
                >
                  Turnovers & Operations Dispatch
                </button>
              )}
              {(currentRole === 'admin' || isCurrent('/admin') || isCurrent('/admin/dashboard')) && (
                <button
                  className={`mobile-nav-link ${isCurrent('/admin') || isCurrent('/admin/dashboard') ? 'active' : ''}`}
                  onClick={() => {
                    onSwitchRole('admin')
                    goTo('/admin', 'admin-dashboard')
                  }}
                >
                  Executive Platform Oversight
                </button>
              )}
            </div>

            <div className="mobile-drawer-divider" />

            <div className="mobile-nav-section-title">SWITCH PREVIEW PERSPECTIVE</div>
            <div className="mobile-role-grid">
              {rolesList.map(r => (
                <button
                  key={r.role}
                  className={`mobile-role-btn ${currentRole === r.role ? 'active' : ''}`}
                  onClick={() => {
                    onSwitchRole(r.role)
                    goTo(r.route)
                  }}
                >
                  <span className={`role-dot ${r.role}`} />
                  <span>{r.role.toUpperCase()}</span>
                </button>
              ))}
            </div>

            {/* Mobile Auth Actions */}
            {currentUser ? (
              <div style={{ padding: '12px 0 0', borderTop: '1px solid var(--line)', marginTop: '14px' }}>
                <div style={{ fontSize: '11.5px', color: 'var(--ink)' }}>
                  Signed in as <strong>{currentUser.fullName}</strong> ({currentUser.role})
                </div>
                <button
                  className="mobile-role-btn"
                  style={{ marginTop: '8px', color: '#c62828', width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onLogout()
                  }}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
                <button
                  className="auth-nav-signin-btn"
                  style={{ border: '1px solid var(--line-strong)', textAlign: 'center', padding: '10px' }}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenAuthModal('login')
                  }}
                >
                  Log In
                </button>
                <button
                  className="auth-nav-register-btn"
                  style={{ textAlign: 'center', padding: '10px' }}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onOpenAuthModal('register')
                  }}
                >
                  Register
                </button>
              </div>
            )}

            <div className="mobile-drawer-footer">
              <button
                className="mobile-ai-trigger-btn"
                onClick={() => {
                  setMobileMenuOpen(false)
                  onOpenAIConcierge()
                }}
              >
                <Sparkles size={16} />
                <span>Ask AI Concierge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
