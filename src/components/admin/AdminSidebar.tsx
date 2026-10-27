import React from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  BarChart3, Building, ShieldCheck, Users, Calendar,
  DollarSign, BookOpen, Tag, Lock, ArrowLeft, RefreshCw
} from 'lucide-react'
import './AdminSidebar.css'

export type AdminSection =
  | 'overview'
  | 'approvals'
  | 'properties'
  | 'users'
  | 'roles'
  | 'bookings'
  | 'finance'
  | 'ledger'
  | 'commissions'
  | 'coupons'
  | 'audit'

interface AdminSidebarProps {
  activeSection: AdminSection
  onSelectSection: (section: AdminSection) => void
  pendingApprovalsCount?: number
  onExit?: () => void
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSelectSection,
  pendingApprovalsCount = 0,
  onExit
}) => {
  const { currentUser, hasPermission } = useAuth()

  // RBAC checks for visible navigation sections
  const canReadAnalytics = hasPermission('analytics.read')
  const canReadUsers = hasPermission('users.read')
  const canReviewProperties = hasPermission('properties.review') || hasPermission('properties.publish')
  const canReadBookings = hasPermission('bookings.read')
  const canReadFinance = hasPermission('analytics.financial.read') || hasPermission('payments.read')
  const canManageSettings = hasPermission('settings.manage')
  const canReadAudit = hasPermission('audit_logs.read')
  const canManageRoles = hasPermission('roles.manage') || hasPermission('users.roles.manage')

  return (
    <aside className="admin-sidebar">
      {/* Brand & Platform Header */}
      <div className="admin-sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span className="admin-sidebar-brand">Maison Véla</span>
          <span className="admin-sidebar-badge">HQ ADMIN</span>
        </div>
        <div style={{ fontSize: '10.5px', color: 'rgba(255, 255, 255, 0.5)' }}>
          Company Governance & Operations
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {/* SECTION: OVERVIEW */}
        <div className="admin-nav-group-title">Overview</div>
        {canReadAnalytics && (
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => onSelectSection('overview')}
          >
            <div className="admin-nav-item-left">
              <BarChart3 size={15} />
              <span>Executive Dashboard</span>
            </div>
          </button>
        )}

        {/* SECTION: MARKETPLACE */}
        <div className="admin-nav-group-title">Marketplace</div>
        {canReviewProperties && (
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'approvals' ? 'active' : ''}`}
            onClick={() => onSelectSection('approvals')}
          >
            <div className="admin-nav-item-left">
              <ShieldCheck size={15} />
              <span>Pending Approvals</span>
            </div>
            {pendingApprovalsCount > 0 && (
              <span className="admin-nav-badge alert">{pendingApprovalsCount}</span>
            )}
          </button>
        )}
        <button
          type="button"
          className={`admin-nav-item ${activeSection === 'properties' ? 'active' : ''}`}
          onClick={() => onSelectSection('properties')}
        >
          <div className="admin-nav-item-left">
            <Building size={15} />
            <span>All Luxury Estates</span>
          </div>
        </button>

        {/* SECTION: USERS & ACCESS */}
        <div className="admin-nav-group-title">Users & Access</div>
        {canReadUsers && (
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => onSelectSection('users')}
          >
            <div className="admin-nav-item-left">
              <Users size={15} />
              <span>All Users & Hosts</span>
            </div>
          </button>
        )}
        {canManageRoles && (
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'roles' ? 'active' : ''}`}
            onClick={() => onSelectSection('roles')}
          >
            <div className="admin-nav-item-left">
              <Lock size={15} />
              <span>Roles & RBAC Matrix</span>
            </div>
          </button>
        )}

        {/* SECTION: BOOKINGS */}
        <div className="admin-nav-group-title">Bookings</div>
        {canReadBookings && (
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'bookings' ? 'active' : ''}`}
            onClick={() => onSelectSection('bookings')}
          >
            <div className="admin-nav-item-left">
              <Calendar size={15} />
              <span>All Reservations</span>
            </div>
          </button>
        )}

        {/* SECTION: FINANCE */}
        <div className="admin-nav-group-title">Finance & Ledger</div>
        {canReadFinance && (
          <>
            <button
              type="button"
              className={`admin-nav-item ${activeSection === 'finance' ? 'active' : ''}`}
              onClick={() => onSelectSection('finance')}
            >
              <div className="admin-nav-item-left">
                <DollarSign size={15} />
                <span>Revenue & GBV</span>
              </div>
            </button>
            <button
              type="button"
              className={`admin-nav-item ${activeSection === 'ledger' ? 'active' : ''}`}
              onClick={() => onSelectSection('ledger')}
            >
              <div className="admin-nav-item-left">
                <BookOpen size={15} />
                <span>Financial Ledger</span>
              </div>
            </button>
          </>
        )}
        {canManageSettings && (
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'commissions' ? 'active' : ''}`}
            onClick={() => onSelectSection('commissions')}
          >
            <div className="admin-nav-item-left">
              <RefreshCw size={15} />
              <span>Commercial Rates</span>
            </div>
          </button>
        )}

        {/* SECTION: MARKETING */}
        <div className="admin-nav-group-title">Marketing & CMS</div>
        {canManageSettings && (
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'coupons' ? 'active' : ''}`}
            onClick={() => onSelectSection('coupons')}
          >
            <div className="admin-nav-item-left">
              <Tag size={15} />
              <span>Coupons & Promotions</span>
            </div>
          </button>
        )}

        {/* SECTION: SYSTEM */}
        <div className="admin-nav-group-title">System & Audit</div>
        {canReadAudit && (
          <button
            type="button"
            className={`admin-nav-item ${activeSection === 'audit' ? 'active' : ''}`}
            onClick={() => onSelectSection('audit')}
          >
            <div className="admin-nav-item-left">
              <Lock size={15} />
              <span>Cryptographic Audit Log</span>
            </div>
          </button>
        )}
      </nav>

      {/* Footer User Info & Exit */}
      <div className="admin-sidebar-footer">
        <div className="admin-user-card">
          <div className="admin-user-info">
            <span className="admin-user-title">{currentUser?.fullName || 'Véla Executive'}</span>
            <span className="admin-user-role-label">{(currentUser?.role || 'ADMIN').replace('_', ' ')}</span>
          </div>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              title="Return to Public Marketplace"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px'
              }}
            >
              <ArrowLeft size={11} />
              <span>Exit</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
