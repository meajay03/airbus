import { Router } from 'express'
import { authRouter } from './auth.js'
import { propertiesRouter } from './properties.js'
import { bookingsRouter } from './bookings.js'
import { conciergeRouter } from './concierge.js'
import { operationsRouter } from './operations.js'
import { adminRouter } from './admin.js'
import { aiRouter } from './ai.js'
import { analyticsRouter } from './analytics.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/properties', propertiesRouter)
apiRouter.use('/bookings', bookingsRouter)
apiRouter.use('/concierge', conciergeRouter)
apiRouter.use('/operations', operationsRouter)
apiRouter.use('/admin/analytics', analyticsRouter)
apiRouter.use('/admin', adminRouter)
apiRouter.use('/ai', aiRouter)
