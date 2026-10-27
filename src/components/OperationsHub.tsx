import React, { useState } from 'react'
import { CleaningTask, MaintenanceTask } from '../data/properties'
import './OperationsHub.css'

interface OperationsHubProps {
  cleaningTasks: CleaningTask[]
  maintenanceTasks: MaintenanceTask[]
  onToggleChecklistItem: (taskId: string, index: number) => void
  onAddMaintenanceTicket: (ticket: Partial<MaintenanceTask>) => void
}

export const OperationsHub: React.FC<OperationsHubProps> = ({
  cleaningTasks,
  maintenanceTasks,
  onToggleChecklistItem,
  onAddMaintenanceTicket
}) => {
  const [activeTab, setActiveTab] = useState<'housekeeping' | 'maintenance'>('housekeeping')
  const [newPropName, setNewPropName] = useState('Casa Serena')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [newCost, setNewCost] = useState(6500)

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDesc) return

    onAddMaintenanceTicket({
      propertyName: newPropName,
      description: newDesc,
      priority: newPriority,
      costEstimate: Number(newCost),
      status: 'open',
      reportedBy: 'Devika Mehra (Operations)',
      createdAt: new Date().toISOString()
    })

    setNewDesc('')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow"><span /> HOSPITALITY OPERATIONS & TURNOVER HUB</span>
          <h1>Operations Center</h1>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>
            Turnover Coordination · Housekeeping Quality Audits · Rapid Maintenance Dispatch
          </p>
        </div>
      </div>

      <div className="dash-tabs">
        <button
          className={`dash-tab-btn ${activeTab === 'housekeeping' ? 'active' : ''}`}
          onClick={() => setActiveTab('housekeeping')}
        >
          Housekeeping Turnovers & Checklists ({cleaningTasks.length})
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          Maintenance Tickets ({maintenanceTasks.length})
        </button>
      </div>

      {/* HOUSEKEEPING TURNOVER CHECKLISTS */}
      {activeTab === 'housekeeping' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {cleaningTasks.map(task => (
            <div
              key={task.id}
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                padding: '24px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--line)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        background: task.status === 'completed' ? '#e8f5e9' : '#fff3e0',
                        color: task.status === 'completed' ? '#2e7d32' : '#e65100',
                        fontSize: '8.5px',
                        letterSpacing: '1px',
                        fontWeight: 600,
                        padding: '3px 8px'
                      }}
                    >
                      {task.status.toUpperCase()}
                    </span>
                    {task.bookingReference && (
                      <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                        Attached Stay Ref: <strong>{task.bookingReference}</strong>
                      </span>
                    )}
                  </div>
                  <h3 style={{ font: '500 20px var(--serif)', margin: '0 0 2px' }}>{task.propertyName}</h3>
                  <small style={{ color: 'var(--muted)', fontSize: '11px' }}>
                    Assigned: {task.assignedTo} · Scheduled: {task.dueAt ? new Date(task.dueAt).toLocaleString() : 'Immediate'}
                  </small>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                    Progress: {task.checklist.filter(i => i.done).length} / {task.checklist.length} Complete
                  </span>
                </div>
              </div>

              {task.notes && (
                <div style={{ background: '#faf9f6', padding: '10px 14px', fontSize: '11px', color: 'var(--ink-soft)', marginBottom: '16px', borderLeft: '2px solid var(--gold)' }}>
                  ★ <strong>Guest Preference:</strong> {task.notes}
                </div>
              )}

              {/* Checklist items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {task.checklist.map((item, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      background: item.done ? '#faf9f6' : '#fff',
                      border: '1px solid var(--line)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textDecoration: item.done ? 'line-through' : 'none',
                      color: item.done ? 'var(--muted)' : 'var(--ink)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => onToggleChecklistItem(task.id, idx)}
                    />
                    <span>{item.task}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MAINTENANCE TICKETS */}
      {activeTab === 'maintenance' && (
        <div className="operations-layout-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {maintenanceTasks.map(ticket => (
              <div
                key={ticket.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  padding: '20px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 600,
                      letterSpacing: '1px',
                      padding: '2px 8px',
                      background: ticket.priority === 'urgent' ? '#ffebee' : ticket.priority === 'high' ? '#fff3e0' : 'var(--paper)',
                      color: ticket.priority === 'urgent' ? 'var(--danger)' : ticket.priority === 'high' ? '#e65100' : 'var(--ink-soft)'
                    }}
                  >
                    PRIORITY: {ticket.priority.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                    Status: <strong>{ticket.status.toUpperCase()}</strong>
                  </span>
                </div>

                <h4 style={{ font: '500 17px var(--serif)', margin: '0 0 6px' }}>
                  {ticket.propertyName}
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  {ticket.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderTop: '1px solid var(--line)', paddingTop: '10px', color: 'var(--ink-soft)' }}>
                  <span>Reported by: {ticket.reportedBy}</span>
                  {ticket.costEstimate && <span>Estimate: ₹{ticket.costEstimate.toLocaleString('en-IN')}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* New Maintenance Ticket form */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', padding: '24px', height: 'max-content' }}>
            <h3 style={{ font: '500 20px var(--serif)', margin: '0 0 16px' }}>
              Report Maintenance Ticket
            </h3>
            <form onSubmit={handleCreateTicket}>
              <div className="form-group">
                <label>Select Property</label>
                <select value={newPropName} onChange={e => setNewPropName(e.target.value)}>
                  <option>Casa Serena</option>
                  <option>The Blue House</option>
                  <option>Casa del Mar</option>
                  <option>Haveli Nilaya</option>
                  <option>The Pahadi House</option>
                  <option>The Glasshouse</option>
                  <option>Penthouse Amber</option>
                  <option>Villa Solarium</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ticket Priority</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)}>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="form-group">
                <label>Detailed Issue Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="E.g., pool heat pump error code, teak terrace polishing required..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Estimated Repair Cost (INR)</label>
                <input
                  type="number"
                  step={500}
                  value={newCost}
                  onChange={e => setNewCost(Number(e.target.value))}
                />
              </div>

              <button type="submit" className="reserve-btn-main">
                Dispatch Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
