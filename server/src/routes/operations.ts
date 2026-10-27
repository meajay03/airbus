import { Router, Request, Response } from 'express'
import { luxuryStore } from '../db/store.js'
import { PostgresRepository } from '../db/postgres.js'

export const operationsRouter = Router()

// GET /api/operations/cleaning
operationsRouter.get('/cleaning', async (_req: Request, res: Response) => {
  try {
    let tasks = []
    try {
      tasks = await PostgresRepository.getCleaningTasks()
    } catch {
      tasks = luxuryStore.cleaningTasks
    }
    res.json({ tasks })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch cleaning tasks' })
  }
})

// PATCH /api/operations/cleaning/:id
operationsRouter.patch('/cleaning/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const { checklistIndex, checklistDone } = req.body

    const inMem = luxuryStore.cleaningTasks.find(t => t.id === id)
    if (inMem && typeof checklistIndex === 'number' && inMem.checklist[checklistIndex]) {
      inMem.checklist[checklistIndex].done = checklistDone ?? !inMem.checklist[checklistIndex].done
      try {
        await PostgresRepository.updateCleaningTask(id, inMem.checklist)
      } catch {
        // fallback
      }
    }

    res.json({ message: 'Cleaning checklist updated successfully', task: inMem })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update cleaning task' })
  }
})

// GET /api/operations/maintenance
operationsRouter.get('/maintenance', async (_req: Request, res: Response) => {
  try {
    let tasks = []
    try {
      tasks = await PostgresRepository.getMaintenanceTasks()
    } catch {
      tasks = luxuryStore.maintenanceTasks
    }
    res.json({ tasks })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch maintenance tasks' })
  }
})

// POST /api/operations/maintenance
operationsRouter.post('/maintenance', async (req: Request, res: Response) => {
  try {
    const { propertyName, description, priority = 'normal', costEstimate } = req.body

    try {
      await PostgresRepository.createMaintenanceTask({ propertyName, description, priority: priority as any })
    } catch {
      // fallback
    }

    const newTask = {
      id: `mnt-${Date.now()}`,
      propertyId: 'prop-casa-serena',
      propertyName: propertyName || 'Casa Serena',
      reportedBy: 'Devika Mehra (Operations)',
      assignedTo: 'Estate Engineering Team',
      description: description || 'Routine maintenance service',
      priority: priority as any,
      status: 'open' as any,
      costEstimate: costEstimate ? Number(costEstimate) : 6500,
      createdAt: new Date().toISOString()
    }

    luxuryStore.maintenanceTasks.unshift(newTask)
    res.status(201).json({ message: 'Maintenance ticket dispatched successfully', task: newTask })
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create maintenance ticket' })
  }
})
