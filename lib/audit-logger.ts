// HIPAA Audit Logging System
// Immutable audit trail for all data access and modifications

import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'access'
  resource: string // appointments, medical-records, vaccinations, etc.
  resourceId?: string
  details: {
    method?: string
    endpoint?: string
    changes?: any
    query?: any
    reason?: string
    [key: string]: any // Allow additional properties
  }
  ipAddress: string
  userAgent: string
  timestamp: Date
  sessionId?: string
  complianceCategory: 'phi_access' | 'data_modification' | 'authentication' | 'authorization' | 'export' | 'other'
  severity: 'info' | 'warning' | 'critical'
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { 
    type: String, 
    required: true, 
    enum: ['create', 'read', 'update', 'delete', 'export', 'login', 'logout', 'access'],
    index: true 
  },
  resource: { type: String, required: true, index: true },
  resourceId: { type: String },
  details: {
    method: String,
    endpoint: String,
    changes: Schema.Types.Mixed,
    query: Schema.Types.Mixed,
    reason: String,
  },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  sessionId: String,
  complianceCategory: {
    type: String,
    enum: ['phi_access', 'data_modification', 'authentication', 'authorization', 'export', 'other'],
    default: 'other',
    index: true,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true,
  },
}, { 
  timestamps: false, // We use our own timestamp field
  collection: 'audit_logs' 
})

// Compound indexes for efficient querying
AuditLogSchema.index({ userId: 1, timestamp: -1 })
AuditLogSchema.index({ resource: 1, action: 1, timestamp: -1 })
AuditLogSchema.index({ complianceCategory: 1, timestamp: -1 })
AuditLogSchema.index({ severity: 1, timestamp: -1 })

// Prevent modifications (immutable audit trail)
AuditLogSchema.pre('findOneAndUpdate', function() {
  throw new Error('Audit logs are immutable and cannot be modified')
})

AuditLogSchema.pre('updateOne', function() {
  throw new Error('Audit logs are immutable and cannot be modified')
})

AuditLogSchema.pre('updateMany', function() {
  throw new Error('Audit logs are immutable and cannot be modified')
})

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

// Audit Logging Functions

/**
 * Log audit event
 */
export async function logAudit(params: {
  userId: string
  action: IAuditLog['action']
  resource: string
  resourceId?: string
  details?: Partial<IAuditLog['details']>
  ipAddress: string
  userAgent: string
  sessionId?: string
  complianceCategory?: IAuditLog['complianceCategory']
  severity?: IAuditLog['severity']
}): Promise<void> {
  try {
    await AuditLog.create({
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      sessionId: params.sessionId,
      complianceCategory: params.complianceCategory || categorizeAction(params.action, params.resource),
      severity: params.severity || determineSeverity(params.action, params.resource),
      timestamp: new Date(),
    })
  } catch (error) {
    // Never fail the main operation due to audit logging
    console.error('Audit logging failed:', error)
  }
}

/**
 * Get audit logs for user
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    action?: string
    resource?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }
): Promise<IAuditLog[]> {
  const query: any = { userId }

  if (options?.action) query.action = options.action
  if (options?.resource) query.resource = options.resource
  if (options?.startDate || options?.endDate) {
    query.timestamp = {}
    if (options.startDate) query.timestamp.$gte = options.startDate
    if (options.endDate) query.timestamp.$lte = options.endDate
  }

  return await AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(options?.limit || 100)
    .lean() as any
}

/**
 * Get audit logs for specific resource
 */
export async function getResourceAuditLogs(
  resource: string,
  resourceId: string
): Promise<any[]> {
  return await AuditLog.find({ resource, resourceId })
    .sort({ timestamp: -1 })
    .populate('userId', 'firstName lastName email')
    .lean() as any
}

/**
 * Generate compliance report
 */
export async function generateComplianceReport(
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number
  byCategory: Record<string, number>
  byAction: Record<string, number>
  bySeverity: Record<string, number>
  phiAccess: number
  criticalEvents: IAuditLog[]
}> {
  const logs = await AuditLog.find({
    timestamp: { $gte: startDate, $lte: endDate },
  }).lean()

  const report = {
    totalEvents: logs.length,
    byCategory: {} as Record<string, number>,
    byAction: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    phiAccess: 0,
    criticalEvents: [] as IAuditLog[],
  }

  logs.forEach(log => {
    // Count by category
    report.byCategory[log.complianceCategory] = (report.byCategory[log.complianceCategory] || 0) + 1

    // Count by action
    report.byAction[log.action] = (report.byAction[log.action] || 0) + 1

    // Count by severity
    report.bySeverity[log.severity] = (report.bySeverity[log.severity] || 0) + 1

    // Count PHI access
    if (log.complianceCategory === 'phi_access') {
      report.phiAccess++
    }

    // Collect critical events
    if (log.severity === 'critical') {
      report.criticalEvents.push(log as any)
    }
  })

  return report
}

/**
 * Cleanup old audit logs (retain for compliance period)
 */
export async function cleanupAuditLogs(retentionDays: number = 2555): Promise<number> {
  // Default: 7 years (HIPAA requirement)
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  
  const result = await AuditLog.deleteMany({
    timestamp: { $lt: cutoffDate },
  })

  return result.deletedCount
}

/**
 * Search audit logs (admin only)
 */
export async function searchAuditLogs(params: {
  userId?: string
  action?: string
  resource?: string
  complianceCategory?: string
  severity?: string
  startDate?: Date
  endDate?: Date
  ipAddress?: string
  limit?: number
  skip?: number
}): Promise<{ logs: IAuditLog[]; total: number }> {
  const query: any = {}

  if (params.userId) query.userId = params.userId
  if (params.action) query.action = params.action
  if (params.resource) query.resource = params.resource
  if (params.complianceCategory) query.complianceCategory = params.complianceCategory
  if (params.severity) query.severity = params.severity
  if (params.ipAddress) query.ipAddress = params.ipAddress

  if (params.startDate || params.endDate) {
    query.timestamp = {}
    if (params.startDate) query.timestamp.$gte = params.startDate
    if (params.endDate) query.timestamp.$lte = params.endDate
  }

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(params.skip || 0)
      .limit(params.limit || 50)
      .populate('userId', 'firstName lastName email role')
      .lean(),
    AuditLog.countDocuments(query),
  ])

  return { logs: logs as any, total }
}

// Helper functions

function categorizeAction(
  action: IAuditLog['action'],
  resource: string
): IAuditLog['complianceCategory'] {
  if (action === 'login' || action === 'logout') return 'authentication'
  if (action === 'export') return 'export'
  if (action === 'read' || action === 'access') return 'phi_access'
  if (action === 'create' || action === 'update' || action === 'delete') return 'data_modification'
  return 'other'
}

function determineSeverity(
  action: IAuditLog['action'],
  resource: string
): IAuditLog['severity'] {
  if (action === 'delete' || action === 'export') return 'critical'
  if (action === 'update') return 'warning'
  return 'info'
}
