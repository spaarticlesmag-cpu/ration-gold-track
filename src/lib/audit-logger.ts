import { supabase } from '@/integrations/supabase/client'

export type AuditAction =
  | 'GPS_UPDATE'
  | 'ORDER_STATUS_CHANGE'
  | 'DELIVERY_START'
  | 'DELIVERY_END'
  | 'EMERGENCY_ALERT'
  | 'ROUTE_OPTIMIZATION'
  | 'AUTHENTICATION'
  | 'QR_SCAN'
  | 'DOCUMENT_UPLOAD'

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface AuditLog {
  id?: string
  user_id: string
  action: AuditAction
  resource_type: 'ORDER' | 'VEHICLE' | 'USER' | 'SYSTEM'
  resource_id: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  location_data?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  severity_level: AuditSeverity
  timestamp: Date
}

export class AuditLogger {
  private static instance: AuditLogger
  private auditQueue: AuditLog[] = []
  private batchSize = 10
  private flushInterval = 30000 // 30 seconds

  constructor() {
    this.startBatchProcessor()
  }

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }

  async log(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      // Add current timestamp
      const logEntry: AuditLog = {
        ...auditLog,
        timestamp: new Date()
      }

      // Add to queue for batch processing
      this.auditQueue.push(logEntry)

      // Process immediately for critical actions
      if (auditLog.severity_level === 'CRITICAL') {
        await this.flushImmediate([logEntry])
      } else if (this.auditQueue.length >= this.batchSize) {
        await this.flushBatch()
      }
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Continue execution even if logging fails
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.auditQueue.length === 0) return

    const batch = [...this.auditQueue]
    this.auditQueue = []

    try {
      await this.flushImmediate(batch)
    } catch (error) {
      console.error('Failed to flush audit batch:', error)
      // Re-queue failed entries
      this.auditQueue.unshift(...batch)
    }
  }

  private async flushImmediate(entries: AuditLog[]): Promise<void> {
    try {
      // TODO: Enable after audit table is created
      /* const { error } = await supabase
        .from('audit_logs')
        .insert(entries.map(entry => ({
          user_id: entry.user_id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: JSON.stringify(entry.details),
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          location_data: entry.location_data,
          severity_level: entry.severity_level,
          timestamp: entry.timestamp.toISOString()
        })))

      if (error) throw error */

      console.log('[AUDIT]', entries.map(entry => ({
        action: entry.action,
        resource: `${entry.resource_type}:${entry.resource_id}`,
        severity: entry.severity_level,
        details: entry.details
      })))

    } catch (error) {
      console.error('Audit log flush failed:', error)
      throw error
    }
  }

  private startBatchProcessor(): void {
    setInterval(() => {
      this.flushBatch().catch(error => {
        console.error('Batch processor error:', error)
      })
    }, this.flushInterval)
  }

  // Utility methods for common audit events
  async logGPSUpdate(userId: string, orderId: string, location: {
    latitude: number
    longitude: number
    accuracy: number
  }, speed?: number): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'GPS_UPDATE',
      resource_type: 'ORDER',
      resource_id: orderId,
      severity_level: 'LOW',
      details: {
        coordinate: `${location.latitude},${location.longitude}`,
        accuracy: location.accuracy,
        speed
      },
      location_data: location
    })
  }

  async logOrderStatusChange(userId: string, orderId: string, oldStatus: string, newStatus: string): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'ORDER_STATUS_CHANGE',
      resource_type: 'ORDER',
      resource_id: orderId,
      severity_level: 'MEDIUM',
      details: {
        from: oldStatus,
        to: newStatus
      }
    })
  }

  async logEmergencyAlert(userId: string, location: {
    latitude: number
    longitude: number
    accuracy: number
  }): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'EMERGENCY_ALERT',
      resource_type: 'USER',
      resource_id: userId,
      severity_level: 'CRITICAL',
      details: {
        alert_type: 'GPS_EMERGENCY',
        message: 'Emergency alert triggered with GPS location'
      },
      location_data: location
    })
  }

  async logAuthentication(userId: string, action: 'LOGIN' | 'LOGOUT' | 'SESSION_EXTENDED', ipAddress?: string): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'AUTHENTICATION',
      resource_type: 'USER',
      resource_id: userId,
      severity_level: 'MEDIUM',
      details: {
        auth_action: action,
        ip_address: ipAddress
      }
    })
  }

  async logQRScan(userId: string, orderId: string, qrCode: string, validationSuccess: boolean): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'QR_SCAN',
      resource_type: 'ORDER',
      resource_id: orderId,
      severity_level: validationSuccess ? 'LOW' : 'HIGH',
      details: {
        qr_code_length: qrCode.length,
        validation_success: validationSuccess,
        hashed_qr: this.hashString(qrCode) // Don't log actual QR content
      }
    })
  }

  private hashString(str: string): string {
    // Simple hash for audit logging (not cryptographically secure)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  }

  // Get audit trail for a resource
  async getAuditTrail(resourceType: string, resourceId: string, limit = 50): Promise<any[]> {
    try {
      // TODO: Enable after audit table is created
      /* const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || [] */

      console.log(`[AUDIT TRAIL] Query: ${resourceType}:${resourceId}, limit: ${limit}`)
      return []
    } catch (error) {
      console.error('Failed to fetch audit trail:', error)
      return []
    }
  }
}

// Singleton instance
export const auditLogger = AuditLogger.getInstance()
