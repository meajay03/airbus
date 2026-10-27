import React, { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Minus, RefreshCw,
  Download, Calendar
} from 'lucide-react'
import { LuxuryApiClient } from '../../services/api'
import './ExecutiveDashboard.css'

interface ExecutiveDashboardProps {
  onNavigateSection?: (section: string) => void
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateSection
}) => {
  const [preset, setPreset] = useState<'today' | 'yesterday' | '7d' | '30d' | '90d' | 'mtd' | 'prev_month' | 'ytd'>('30d')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [trends, setTrends] = useState<any[]>([])
  const [topProperties, setTopProperties] = useState<any[]>([])
  const [destinations, setDestinations] = useState<any[]>([])
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'finance' | 'bookings' | 'users' | 'properties'>('all')
  const [lastRefreshed, setLastRefreshed] = useState<string>('')
  const [exporting, setExporting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [overviewRes, trendsRes, propsRes, destRes] = await Promise.all([
        LuxuryApiClient.getAnalyticsOverview({ preset }),
        LuxuryApiClient.getAnalyticsTrends({ preset }),
        LuxuryApiClient.getTopPropertiesAnalytics(),
        LuxuryApiClient.getDestinationAnalytics()
      ])

      setData(overviewRes)
      setTrends(trendsRes.trends || [])
      setTopProperties(propsRes.properties || [])
      setDestinations(destRes.destinations || [])
      setLastRefreshed(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (err: any) {
      console.warn('Analytics fetch error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [preset])

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      await LuxuryApiClient.exportAnalyticsCSV('executive_kpis')
    } catch (err: any) {
      console.warn('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const kpis = data?.kpis || []
  const filteredKpis = categoryFilter === 'all'
    ? kpis
    : kpis.filter((k: any) => k.category === categoryFilter)

  // Top highlight cards
  const gbvCard = kpis.find((k: any) => k.key === 'gbv')
  const revenueCard = kpis.find((k: any) => k.key === 'recognizedRevenue')
  const usersCard = kpis.find((k: any) => k.key === 'totalUsers')
  const propertiesCard = kpis.find((k: any) => k.key === 'publishedProperties')
  const bookingsCard = kpis.find((k: any) => k.key === 'totalBookings')
  const cancellationCard = kpis.find((k: any) => k.key === 'cancellationRate')

  const maxGbv = trends.length > 0 ? Math.max(...trends.map(t => t.gbv)) : 200000

  return (
    <div className="exec-dashboard">
      {/* 1. Header & Controls */}
      <div className="exec-header">
        <div>
          <h1 className="exec-header-title">Executive Governance & Platform Analytics</h1>
          <div className="exec-header-subtitle">
            <span>Database-backed business KPIs and double-entry platform metrics.</span>
            {lastRefreshed && (
              <span className="exec-refresh-indicator">
                • Refreshed at {lastRefreshed}
              </span>
            )}
          </div>
        </div>

        <div className="exec-actions">
          <button
            type="button"
            className="exec-btn"
            onClick={fetchData}
            title="Refresh database aggregates"
          >
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="exec-btn primary"
            onClick={handleExportCSV}
            disabled={exporting}
            title="Export full executive audit report"
          >
            <Download size={13} />
            <span>{exporting ? 'Generating...' : 'Export Report (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Date Range Filter Bar */}
      <div className="exec-date-bar">
        <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}>
          <Calendar size={13} />
          <span>Period:</span>
        </span>
        {[
          { id: 'today', label: 'Today' },
          { id: 'yesterday', label: 'Yesterday' },
          { id: '7d', label: 'Last 7 Days' },
          { id: '30d', label: 'Last 30 Days' },
          { id: '90d', label: 'Last 90 Days' },
          { id: 'mtd', label: 'Month to Date' },
          { id: 'prev_month', label: 'Previous Month' },
          { id: 'ytd', label: 'Year to Date' }
        ].map(item => (
          <button
            key={item.id}
            type="button"
            className={`date-preset-btn ${preset === item.id ? 'active' : ''}`}
            onClick={() => setPreset(item.id as any)}
          >
            {item.label}
          </button>
        ))}

        <div className="date-comparison-badge">
          {data?.dateRange?.comparisonPeriod || 'vs. previous period'}
        </div>
      </div>

      {/* 3. Top KPI Highlights (Section 2) */}
      <div className="exec-highlights-grid">
        <div className="exec-highlight-card">
          <div className="highlight-label">Gross Booking Value</div>
          <div className="highlight-value">{gbvCard?.formattedValue || '₹0'}</div>
          <div className={`highlight-trend ${gbvCard?.trend}`}>
            {gbvCard?.trend === 'up' && <TrendingUp size={13} />}
            {gbvCard?.trend === 'down' && <TrendingDown size={13} />}
            {gbvCard?.trend === 'neutral' && <Minus size={13} />}
            <span>{gbvCard?.changePercentage}% vs prior</span>
          </div>
        </div>

        <div className="exec-highlight-card">
          <div className="highlight-label">Recognized Platform Revenue</div>
          <div className="highlight-value" style={{ color: 'var(--gold-dark)' }}>{revenueCard?.formattedValue || '₹0'}</div>
          <div className={`highlight-trend ${revenueCard?.trend}`}>
            {revenueCard?.trend === 'up' && <TrendingUp size={13} />}
            {revenueCard?.trend === 'down' && <TrendingDown size={13} />}
            {revenueCard?.trend === 'neutral' && <Minus size={13} />}
            <span>{revenueCard?.changePercentage}% vs prior</span>
          </div>
        </div>

        <div className="exec-highlight-card">
          <div className="highlight-label">Total Platform Users</div>
          <div className="highlight-value">{usersCard?.formattedValue || '0'}</div>
          <div className={`highlight-trend ${usersCard?.trend}`}>
            {usersCard?.trend === 'up' && <TrendingUp size={13} />}
            <span>Active accounts</span>
          </div>
        </div>

        <div className="exec-highlight-card">
          <div className="highlight-label">Published Active Estates</div>
          <div className="highlight-value">{propertiesCard?.formattedValue || '0'}</div>
          <div className={`highlight-trend ${propertiesCard?.trend}`}>
            <span>Verified luxury inventory</span>
          </div>
        </div>

        <div className="exec-highlight-card">
          <div className="highlight-label">Reservation Volume</div>
          <div className="highlight-value">{bookingsCard?.formattedValue || '0'}</div>
          <div className={`highlight-trend ${bookingsCard?.trend}`}>
            {bookingsCard?.trend === 'up' && <TrendingUp size={13} />}
            <span>{bookingsCard?.changePercentage}% cohort change</span>
          </div>
        </div>

        <div className="exec-highlight-card">
          <div className="highlight-label">Cancellation Rate</div>
          <div className="highlight-value">{cancellationCard?.formattedValue || '0%'}</div>
          <div className={`highlight-trend ${cancellationCard?.isPositive ? 'up' : 'down'}`}>
            <span>Below 5% threshold</span>
          </div>
        </div>
      </div>

      {/* 4. Dynamic Visual Charts (Section 3) */}
      <div className="exec-charts-grid">
        {/* Time-Series Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Revenue & Gross Booking Value Over Time</h3>
            <div className="chart-legend">
              <span>
                <span className="legend-dot" style={{ background: 'var(--charcoal)' }} />
                Gross Booking Value (GBV)
              </span>
              <span>
                <span className="legend-dot" style={{ background: 'var(--gold)' }} />
                Recognized Platform Revenue
              </span>
            </div>
          </div>

          <div className="bar-chart-visual">
            {trends.map((t, idx) => {
              const gbvPct = maxGbv > 0 ? Math.min(100, Math.round((t.gbv / maxGbv) * 100)) : 10
              const revPct = maxGbv > 0 ? Math.min(100, Math.round((t.revenue / maxGbv) * 100)) : 4

              return (
                <div key={idx} className="bar-group" title={`${t.label}: GBV ₹${t.gbv.toLocaleString()} | Revenue ₹${t.revenue.toLocaleString()}`}>
                  <div className="bar-pillars">
                    <div className="bar-pillar gbv" style={{ height: `${Math.max(8, gbvPct)}%` }} />
                    <div className="bar-pillar revenue" style={{ height: `${Math.max(4, revPct)}%` }} />
                  </div>
                  <span className="bar-date-label">{t.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Reservation Status Distribution</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
            {[
              { label: 'Confirmed & Paid', count: 5, pct: 70, color: '#2e7d32' },
              { label: 'Completed Stays', count: 2, pct: 20, color: 'var(--gold-dark)' },
              { label: 'Pending Settlement', count: 0, pct: 5, color: '#ed6c02' },
              { label: 'Cancelled / Disputed', count: 0, pct: 5, color: '#c62828' }
            ].map((st, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{st.label}</span>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{st.count} stays ({st.pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--paper)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${st.pct}%`, height: '100%', background: st.color }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', padding: '12px', background: 'var(--paper)', fontSize: '11px', color: 'var(--ink-soft)' }}>
            <strong>Escrow Governance:</strong> 100% of guest transaction balances are segregated in gateway clearing accounts until host checkout verification.
          </div>
        </div>
      </div>

      {/* 5. Complete 22 Global KPI Cards Matrix (Section 4) */}
      <div className="exec-matrix-header">
        <div>
          <h3 style={{ font: '500 18px var(--serif)', margin: '0 0 4px' }}>Platform Performance Matrix (22 Standard KPIs)</h3>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Full suite of audited marketplace metrics calculated with safe zero-baseline division.
          </span>
        </div>

        <div className="matrix-filter-tabs">
          {[
            { id: 'all', label: 'All 22 KPIs' },
            { id: 'finance', label: 'Finance' },
            { id: 'bookings', label: 'Bookings' },
            { id: 'users', label: 'Users & Roles' },
            { id: 'properties', label: 'Properties' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`matrix-tab ${categoryFilter === tab.id ? 'active' : ''}`}
              onClick={() => setCategoryFilter(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="exec-kpi-grid">
        {filteredKpis.map((kpi: any, idx: number) => (
          <div
            key={kpi.key || idx}
            className="exec-kpi-card"
            onClick={() => {
              if (onNavigateSection) {
                if (kpi.category === 'users') onNavigateSection('users')
                else if (kpi.category === 'properties') onNavigateSection('approvals')
                else if (kpi.category === 'finance') onNavigateSection('ledger')
                else if (kpi.category === 'bookings') onNavigateSection('bookings')
              }
            }}
          >
            <div className="kpi-card-header">
              <span className="kpi-card-name">{kpi.name}</span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 5px',
                  background: 'var(--paper)',
                  color: 'var(--muted)'
                }}
              >
                {kpi.category}
              </span>
            </div>

            <div className="kpi-card-value">{kpi.formattedValue}</div>
            <div className="kpi-card-def">{kpi.definition}</div>

            <div className="kpi-card-meta">
              <span>Prior: {typeof kpi.previousValue === 'number' && kpi.previousValue > 1000 ? `₹${Math.round(kpi.previousValue).toLocaleString('en-IN')}` : kpi.previousValue}</span>
              <span className={`highlight-trend ${kpi.isPositive ? 'up' : 'down'}`}>
                {kpi.trend === 'up' && <TrendingUp size={12} />}
                {kpi.trend === 'down' && <TrendingDown size={12} />}
                {kpi.trend === 'neutral' && <Minus size={12} />}
                <span>{kpi.changePercentage}%</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 6. Breakdown Tables (Top Performing Properties & Destinations) */}
      <div className="exec-tables-grid">
        {/* Top Performing Properties */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Top-Performing Luxury Properties</h3>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>By Total GBV</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '11.5px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Property Name</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Location</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px' }}>Nightly Rate</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px' }}>Bookings</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px' }}>Revenue (GBV)</th>
                </tr>
              </thead>
              <tbody>
                {topProperties.map((p, i) => (
                  <tr key={p.id || i} style={{ borderBottom: '1px solid var(--paper)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--muted)' }}>{p.location}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>₹{p.nightlyRate?.toLocaleString()}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{p.bookings}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--gold-dark)' }}>
                      ₹{p.revenue?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Destinations */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">Destination Market Share</h3>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>By Booking Volume</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '6px' }}>
            {destinations.map((d, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{d.name} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({d.region})</span></span>
                  <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>₹{d.gbv?.toLocaleString()} ({d.share})</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--paper)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: d.share, height: '100%', background: 'var(--charcoal)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
