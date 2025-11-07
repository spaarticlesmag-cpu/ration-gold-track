import { supabase } from '@/integrations/supabase/client'

export type SMSMessageType =
  | 'DELIVERY_STATUS_UPDATE'
  | 'ETA_UPDATE'
  | 'EMERGENCY_ALERT'
  | 'SCHEDULE_CHANGE'
  | 'PAYMENT_REMINDER'

export interface SMSMessage {
  id?: string
  recipient_phone: string
  sender_phone?: string
  message_type: SMSMessageType
  message_content: string
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
  reference_id?: string // Order ID, delivery ID, etc.
  cost?: number
  delivered_at?: Date
  error_message?: string
  retry_count: number
  max_retries: number
  created_at: Date
}

export interface SMSConfig {
  provider: 'TWILIO' | 'AWS_SNS' | 'MSG91' | 'TEXTLOCAL'
  apiKey: string
  apiSecret?: string
  accountSid?: string
  fromNumber: string
  region?: string
}

// Default SMS configuration (production values should come from environment vars)
const DEFAULT_SMS_CONFIG: SMSConfig = {
  provider: 'TWILIO', // Placeholder - configure based on your SMS provider
  apiKey: process.env.VITE_TWILIO_API_KEY || 'dummy_key',
  apiSecret: process.env.VITE_TWILIO_API_SECRET || 'dummy_secret',
  accountSid: process.env.VITE_TWILIO_ACCOUNT_SID || 'dummy_sid',
  fromNumber: process.env.VITE_TWILIO_FROM_NUMBER || '+1234567890'
}

export class SMSService {
  private static instance: SMSService
  private config: SMSConfig
  private rateLimitQueue: SMSMessage[] = []
  private sendingInProgress = false
  private rateLimitMs = 1000 // 1 SMS per second for safety
  private lastSendTime = 0

  constructor(config: SMSConfig = DEFAULT_SMS_CONFIG) {
    this.config = config
  }

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService()
    }
    return SMSService.instance
  }

  async sendSMS(message: Omit<SMSMessage, 'id' | 'status' | 'created_at' | 'retry_count'>): Promise<boolean> {
    try {
      const smsEntry: SMSMessage = {
        ...message,
        status: 'PENDING',
        created_at: new Date(),
        retry_count: 0,
        max_retries: message.priority === 'CRITICAL' ? 5 : 3
      }

      // For high/critical priority, send immediately
      if (message.priority === 'HIGH' || message.priority === 'CRITICAL') {
        return await this.sendImmediately(smsEntry)
      }

      // Otherwise queue for rate limiting
      this.rateLimitQueue.push(smsEntry)
      await this.processQueue()

      return true

    } catch (error) {
      console.error('Failed to queue SMS:', error)
      return false
    }
  }

  private async processQueue(): Promise<void> {
    if (this.sendingInProgress || this.rateLimitQueue.length === 0) return

    this.sendingInProgress = true

    try {
      while (this.rateLimitQueue.length > 0) {
        const now = Date.now()
        const timeSinceLastSend = now - this.lastSendTime

        if (timeSinceLastSend < this.rateLimitMs) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitMs - timeSinceLastSend))
        }

        const message = this.rateLimitQueue.shift()
        if (message) {
          await this.sendImmediately(message)
          this.lastSendTime = Date.now()
        }
      }
    } finally {
      this.sendingInProgress = false
    }
  }

  private async sendImmediately(message: SMSMessage): Promise<boolean> {
    try {
      // Log SMS attempt
      await this.logSMSAttempt(message)

      // In development, just simulate sending
      if (process.env.NODE_ENV === 'development') {
        console.log('[SMS SIMULATION]', {
          to: message.recipient_phone,
          from: DEFAULT_SMS_CONFIG.fromNumber,
          message: message.message_content.substring(0, 50) + '...',
          type: message.message_type,
          priority: message.priority
        })

        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
        return true
      }

      // Production SMS sending (enable after SMS provider setup)
      // return await this.sendViaProvider(message)

      return true

    } catch (error) {
      console.error('SMS sending failed:', error)
      await this.handleSendFailure(message, error)
      return false
    }
  }

  private async logSMSAttempt(message: SMSMessage): Promise<void> {
    try {
      // TODO: Enable after SMS log table is created
      /* const { error } = await supabase
        .from('sms_logs')
        .insert({
          recipient_phone: message.recipient_phone,
          message_type: message.message_type,
          message_content: message.message_content,
          status: message.status,
          priority: message.priority,
          reference_id: message.reference_id
        })

      if (error) throw error */
    } catch (error) {
      console.warn('Failed to log SMS attempt:', error)
      // Don't fail the SMS sending due to logging failure
    }
  }

  private async handleSendFailure(message: SMSMessage, error: any): Promise<void> {
    message.retry_count++
    message.error_message = error.message || 'Unknown error'
    message.status = 'FAILED'

    if (message.retry_count < message.max_retries) {
      // Retry logic - add back to queue with delay
      setTimeout(() => {
        this.rateLimitQueue.unshift(message)
        this.processQueue()
      }, Math.pow(2, message.retry_count) * 1000) // Exponential backoff
    }
  }

  /*
  private async sendViaProvider(message: SMSMessage): Promise<boolean> {
    // Uncomment and configure based on your SMS provider

    switch (this.config.provider) {
      case 'TWILIO':
        return await this.sendViaTwilio(message)

      case 'AWS_SNS':
        return await this.sendViaAWSSNS(message)

      case 'MSG91':
        return await this.sendViaMSG91(message)

      default:
        throw new Error(`Unsupported SMS provider: ${this.config.provider}`)
    }
  }

  private async sendViaTwilio(message: SMSMessage): Promise<boolean> {
    // Twilio implementation
    return true
  }

  private async sendViaAWSSNS(message: SMSMessage): Promise<boolean> {
    // AWS SNS implementation
    return true
  }

  private async sendViaMSG91(message: SMSMessage): Promise<boolean> {
    // MSG91 implementation
    return true
  }
  */
}

// Global SMS service instance
export const smsService = SMSService.getInstance()

// SMS Template Functions
export const SMSTemplates = {
  DELIVERY_STATUS_UPDATE: (params: {
    driverName: string
    vehicleNumber: string
    status: string
    estimatedTime?: string
  }) => {
    return `JADAYU: Your delivery by ${params.driverName} (${params.vehicleNumber}) is now ${params.status}.
    ${params.estimatedTime ? `Expected: ${params.estimatedTime}. ` : ''}Track: https://jadayu.app/track`
  },

  ETA_UPDATE: (params: {
    newEta: string
    reason?: string
  }) => {
    return `JADAYU: Updated ETA - ${params.newEta}.
    ${params.reason ? `Reason: ${params.reason}. ` : ''}Track delivery: https://jadayu.app/track`
  },

  EMERGENCY_ALERT: (params: {
    partnerName: string
    phoneNumber: string
    latitude: number
    longitude: number
    accuracy: number
  }) => {
    return `🚨 JADAYU EMERGENCY: ${params.partnerName} (${params.phoneNumber}) needs assistance!
    Location: ${params.latitude.toFixed(4)},${params.longitude.toFixed(4)} (±${Math.round(params.accuracy)}m)
    Call: ${params.phoneNumber}`
  },

  SCHEDULE_CHANGE: (params: {
    oldDateTime: string
    newDateTime: string
    reason: string
  }) => {
    return `JADAYU: Schedule changed from ${params.oldDateTime} to ${params.newDateTime}.
    Reason: ${params.reason}. Contact support if needed.`
  },

  PAYMENT_REMINDER: (params: {
    amount: number
    dueDate: string
  }) => {
    return `JADAYU: Payment reminder - ₹${params.amount} due by ${params.dueDate}.
    Pay online: https://jadayu.app/pay`
  }
}

// Convenience functions for common SMS sending
export const sendDeliveryStatusSMS = async (
  customerPhone: string,
  orderId: string,
  params: Parameters<typeof SMSTemplates.DELIVERY_STATUS_UPDATE>[0]
): Promise<boolean> => {
  const message = SMSTemplates.DELIVERY_STATUS_UPDATE(params)
  return await smsService.sendSMS({
    recipient_phone: customerPhone,
    message_type: 'DELIVERY_STATUS_UPDATE',
    message_content: message,
    priority: 'NORMAL',
    reference_id: orderId,
    max_retries: 3
  })
}

export const sendEmergencySMS = async (
  recipientPhones: string[],
  partnerName: string,
  phoneNumber: string,
  location: { latitude: number; longitude: number; accuracy: number },
  referenceId: string
): Promise<boolean> => {
  const message = SMSTemplates.EMERGENCY_ALERT({
    partnerName,
    phoneNumber,
    ...location
  })

  // Send to multiple recipients (emergency contacts, admin, etc.)
  const sendPromises = recipientPhones.map(phone =>
    smsService.sendSMS({
      recipient_phone: phone,
      message_type: 'EMERGENCY_ALERT',
      message_content: message,
      priority: 'CRITICAL',
      reference_id: referenceId,
      max_retries: 5
    })
  )

  const results = await Promise.all(sendPromises)
  return results.every(success => success)
}

export const sendETAUpdateSMS = async (
  customerPhone: string,
  orderId: string,
  params: Parameters<typeof SMSTemplates.ETA_UPDATE>[0]
): Promise<boolean> => {
  const message = SMSTemplates.ETA_UPDATE(params)
  return await smsService.sendSMS({
    recipient_phone: customerPhone,
    message_type: 'ETA_UPDATE',
    message_content: message,
    priority: 'HIGH',
    reference_id: orderId,
    max_retries: 3
  })
}

// Bulk SMS sending for campaigns
export const sendBulkSMS = async (
  recipients: Array<{ phone: string; orderId: string }>,
  template: keyof typeof SMSTemplates,
  templateParams: any
): Promise<{ success: number; failed: number; total: number }> => {
  const message = SMSTemplates[template](templateParams)

  const results = await Promise.all(
    recipients.map(({ phone, orderId }) =>
      smsService.sendSMS({
        recipient_phone: phone,
        message_type: template,
        message_content: message,
        priority: 'NORMAL',
        reference_id: orderId,
        max_retries: 3
      })
    )
  )

  const success = results.filter(Boolean).length
  const failed = results.length - success

  return { success, failed, total: results.length }
}
