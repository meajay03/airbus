import { Router, Request, Response } from 'express'
import { AnalyticsService, DateRangeFilter } from '../services/analyticsService.js'
import { requirePermission } from '../middleware/auth.js'
import { AuthService } from '../services/authService.js'

export const analyticsRouter = Router()

/**
 * GET /api/admin/analytics/overview (also /api/v1/admin/analytics/overview)
 */
analyticsRouter.get('/overview', requirePermission('analytics.read'), async (req: Request, res: Response) => {
  try {
    const { preset, startDate, endDate } = req.query as Record<string, string>
    const filter: DateRangeFilter = {
      preset: (preset as any) || '30d',
      startDate,
      endDate
    }

    const data = await AnalyticsService.getExecutiveMetrics(filter)
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/admin/analytics/trends
 */
analyticsRouter.get('/trends', requirePermission('analytics.read'), async (req: Request, res: Response) => {
  try {
    const { preset, startDate, endDate } = req.query as Record<string, string>
    const trends = await AnalyticsService.getTimeSeriesTrends({
      preset: (preset as any) || '30d',
      startDate,
      endDate
    })
    res.json({ trends })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/admin/analytics/top-properties
 */
analyticsRouter.get('/top-properties', requirePermission('analytics.read'), async (_req: Request, res: Response) => {
  try {
    const properties = await AnalyticsService.getTopProperties()
    res.json({ properties })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/admin/analytics/destinations
 */
analyticsRouter.get('/destinations', requirePermission('analytics.read'), async (_req: Request, res: Response) => {
  try {
    const destinations = await AnalyticsService.getDestinationPerformance()
    res.json({ destinations })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/admin/analytics/export (CSV export)
 */
analyticsRouter.get('/export', requirePermission('reports.export'), async (req: Request, res: Response) => {
  try {
    const { reportType } = req.query
    const metrics = await AnalyticsService.getExecutiveMetrics()
    
    // Log the sensitive export event
    if (req.user) {
      await AuthService.logAuditEvent(req.user.id, 'EXPORT_REPORT', 'analytics', null, { reportType: reportType || 'kpi_overview' })
    }

    let csvContent = 'Metric,Value,Previous Period,Change %,Trend,Definition\n'
    metrics.kpis.forEach(k => {
      csvContent += `"${k.name}","${k.formattedValue}","${k.previousValue}","${k.changePercentage}%","${k.trend}","${k.definition}"\n`
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="maison_vela_analytics_${Date.now()}.csv"`)
    res.send(csvContent)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
