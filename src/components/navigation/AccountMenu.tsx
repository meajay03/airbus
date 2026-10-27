import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { User as UserType } from '../../types'
import {
  ShieldCheck, Heart, LogOut, ChevronDown, Calendar,
  DollarSign, Settings, Users,
  BarChart3, Home, BedDouble, Bell, Mail, Building
} from 'lucide-react'
import './AccountMenu.css'

interface AccountMenuProps {
  currentUser?: UserType | null
  onOpenAuthModal: (mode: 'login' | 'register') => void
  onOpenWishlist: () => void
  wishlistCount?: number
  onLogout?: () => void
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  currentUser: propUser,
  onOpenAuthModal,
  onOpenWishlist,
  wishlistCount = 0,
  onLogout
}) => {
  const auth = useAuth()
  const currentUser = propUser !== undefined ? propUser : auth.currentUser
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavigate = (path: string) => {
    setIsOpen(false)
    navigate(path)
  }

  const handleLogout = async () => {
    setIsOpen(false)
    if (onLogout) {
      await onLogout()
    } else {
      await auth.logout()
      navigate('/')
    }
  }

  // 1. Unauthenticated Visitor Navigation (Not logged in or registered)
  if (!currentUser) {
    return (
      <div className="account-menu-container">
        <div className="account-anon-actions">
          <button
            type="button"
            className="account-login-btn account-signin-btn"
            onClick={() => onOpenAuthModal('login')}
          >
            Log In
          </button>
          <button
            type="button"
            className="account-register-btn account-join-btn"
            onClick={() => onOpenAuthModal('register')}
          >
            Register
          </button>
        </div>
      </div>
    )
  }

  const userInitials = currentUser.fullName
    ? currentUser.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U'

  const userRole = currentUser.role || 'guest'
  const userRoles = currentUser.roles || [userRole]
  const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin') || auth.hasRole('admin') || auth.hasRole('super_admin')
  const isHost = userRoles.includes('host') || userRoles.includes('owner') || auth.hasRole('host') || auth.hasRole('owner')
  const isHotelMgr = userRoles.includes('hotel_manager') || userRoles.includes('manager') || userRoles.includes('property_manager') || auth.hasRole('property_manager')
  const isStaff = userRoles.includes('front_desk') || userRoles.includes('housekeeping') || userRoles.includes('support_agent') || auth.hasRole('support_agent')

  return (
    <div className="account-menu-container" ref={menuRef}>
      {/* Wishlist quick icon */}
      <button
        type="button"
        className="wishlist-btn"
        onClick={onOpenWishlist}
        title="Saved Stays"
        style={{ marginRight: '8px' }}
      >
        <Heart size={16} strokeWidth={1.8} />
        {wishlistCount > 0 && <span className="wishlist-count">{wishlistCount}</span>}
      </button>

      {/* Dynamic Account Trigger */}
      <button
        type="button"
        className={`account-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Account & Portal Management"
        aria-expanded={isOpen}
      >
        <div className={`account-avatar-badge ${isAdmin ? 'admin' : isHost ? 'host' : ''}`}>
          {userInitials}
        </div>
        <div className="account-user-meta">
          <span className="account-user-name">{currentUser.fullName.split(' ')[0]}</span>
          <span className="account-user-role">{currentUser.role.replace('_', ' ')}</span>
        </div>
        <ChevronDown size={12} color="var(--muted)" />
      </button>

      {/* Role-Aware Dropdown Panel */}
      {isOpen && (
        <div className="account-dropdown-panel">
          {/* Header Profile Identity */}
          <div className="account-panel-header">
            <div className="account-panel-name">{currentUser.fullName}</div>
            <div className="account-panel-email">{currentUser.email}</div>
            <div className="account-panel-role-tag">
              <ShieldCheck size={11} />
              <span>{currentUser.role.toUpperCase()} PRIVILEGE</span>
            </div>
          </div>

          {/* Role-Specific Navigation Links */}
          <div className="account-nav-group">
            <div className="account-nav-label">Portals & Workspaces</div>

            {/* SUPER ADMIN & ADMIN */}
            {isAdmin && (
              <>
                <button
                  type="button"
                  className="account-nav-item highlight"
                  onClick={() => handleNavigate('/admin')}
                >
                  <BarChart3 size={14} />
                  <span>Company Admin Panel</span>
                </button>
                <button
                  type="button"
                  className="account-nav-item"
                  onClick={() => handleNavigate('/admin')}
                >
                  <Users size={14} />
                  <span>User Governance & RBAC</span>
                </button>
                <button
                  type="button"
                  className="account-nav-item"
                  onClick={() => handleNavigate('/admin')}
                >
                  <Building size={14} />
                  <span>Property Verification Queue</span>
                </button>
              </>
            )}

            {/* HOST & OWNER */}
            {isHost && (
              <>
                <button
                  type="button"
                  className="account-nav-item highlight"
                  onClick={() => handleNavigate('/owner/portal')}
                >
                  <Home size={14} />
                  <span>Host Dashboard</span>
                </button>
                <button
                  type="button"
                  className="account-nav-item"
                  onClick={() => handleNavigate('/owner/portal')}
                >
                  <Building size={14} />
                  <span>My Estates & Inventory</span>
                </button>
                <button
                  type="button"
                  className="account-nav-item"
                  onClick={() => handleNavigate('/owner/portal')}
                >
                  <Calendar size={14} />
                  <span>Reservations & Rates</span>
                </button>
                <button
                  type="button"
                  className="account-nav-item"
                  onClick={() => handleNavigate('/owner/portal')}
                >
                  <DollarSign size={14} />
                  <span>Earnings & Payouts</span>
                </button>
              </>
            )}

            {/* HOTEL MANAGER */}
            {isHotelMgr && (
              <>
                <button
                  type="button"
                  className="account-nav-item highlight"
                  onClick={() => handleNavigate('/owner/portal')}
                >
                  <Building size={14} />
                  <span>Assigned Properties</span>
                </button>
                <button
                  type="button"
                  className="account-nav-item"
                  onClick={() => handleNavigate('/owner/portal')}
                >
                  <BedDouble size={14} />
                  <span>Room Inventory & Units</span>
                </button>
                <button
                  type="button"
                  className="account-nav-item"
                  onClick={() => handleNavigate('/operations')}
                >
                  <Calendar size={14} />
                  <span>Front Desk & Housekeeping</span>
                </button>
              </>
            )}

            {/* STAFF */}
            {isStaff && (
              <button
                type="button"
                className="account-nav-item highlight"
                onClick={() => handleNavigate('/operations')}
              >
                <Calendar size={14} />
                <span>Authorized Operational Hub</span>
              </button>
            )}

            {/* GUEST */}
            <button
              type="button"
              className="account-nav-item"
              onClick={() => handleNavigate('/guest/dashboard')}
            >
              <Calendar size={14} />
              <span>My Trips & Bookings</span>
            </button>
            <button
              type="button"
              className="account-nav-item"
              onClick={() => {
                setIsOpen(false)
                onOpenWishlist()
              }}
            >
              <Heart size={14} />
              <span>Saved Wishlist ({wishlistCount})</span>
            </button>
            <button
              type="button"
              className="account-nav-item"
              onClick={() => handleNavigate('/guest/dashboard')}
            >
              <Mail size={14} />
              <span>Host Messages & Support</span>
            </button>
            <button
              type="button"
              className="account-nav-item"
              onClick={() => handleNavigate('/guest/dashboard')}
            >
              <Bell size={14} />
              <span>Notifications & Alerts</span>
            </button>
            <button
              type="button"
              className="account-nav-item"
              onClick={() => handleNavigate('/guest/dashboard')}
            >
              <Settings size={14} />
              <span>Account Settings</span>
            </button>
          </div>

          {/* Quick Perspective Switcher for Six Launch Roles */}
          <div className="account-nav-group">
            <div className="account-nav-label">Launch Roles Perspective Switch</div>
            <div className="account-perspective-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {[
                { role: 'guest', label: 'Guest', route: '/guest/dashboard' },
                { role: 'host', label: 'Host', route: '/owner/portal' },
                { role: 'property_manager', label: 'Manager', route: '/owner/portal' },
                { role: 'support_agent', label: 'Staff', route: '/operations/hub' },
                { role: 'admin', label: 'Admin', route: '/admin' },
                { role: 'super_admin', label: 'Super', route: '/admin' }
              ].map(p => (
                <button
                  key={p.role}
                  type="button"
                  className={`perspective-pill ${currentUser.role === p.role ? 'current' : ''}`}
                  onClick={async () => {
                    await auth.switchPerspective(p.role)
                    setIsOpen(false)
                    navigate(p.route)
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sign Out */}
          <div className="account-nav-group" style={{ borderBottom: 'none' }}>
            <button
              type="button"
              className="account-nav-item danger"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
