import { Request, Response, NextFunction } from 'express'

export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Maison Véla Error]:', error)
  const status = error.status || error.statusCode || 500
  res.status(status).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred in the hospitality system.'
    }
  })
}
