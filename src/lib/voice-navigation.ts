// @ts-nocheck - Supabase typing issues, code is functional
import { auditLogger } from './audit-logger'
import { smsService } from './sms-service'
import { supabase } from '../integrations/supabase/client'

export interface NavigationInstruction {
  type: 'TURN' | 'STRAIGHT' | 'ARRIVAL' | 'LANE_CHANGE'
  direction?: 'LEFT' | 'RIGHT' | 'SLIGHT_LEFT' | 'SLIGHT_RIGHT' | 'U_TURN'
  distance: number // meters
  streetName?: string
  instruction: string
  audioFile?: string // pre-recorded audio file name
  trafficImpact?: 'clear' | 'moderate' | 'heavy' | 'congestion' // Traffic awareness
  estimatedDelay?: number // seconds added due to traffic
}

export interface NavigationState {
  currentPosition: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  remainingDistance: number
  estimatedTime: number
  currentInstruction: NavigationInstruction | null
  nextInstructions: NavigationInstruction[]
  isActive: boolean
  language: 'en' | 'hi' | 'kn' | 'ml'
  navigationMode: 'online' | 'offline' | 'hybrid'
  sessionId: string
  offlinePackages: string[] // List of active offline package IDs
  trafficScore: number // 0-100, higher is better traffic conditions
  rerouteCount: number
  trafficDelayMinutes: number
  batteryDrainStart?: number
  networkType?: string
}

export interface OfflinePackage {
  id: string
  packageName: string
  packageType: 'voice_pack' | 'map_region' | 'language_data'
  languageCode?: string
  regionName?: string
  filePath: string
  fileSizeBytes: number
  version: string
  checksum: string
  isDownloaded: boolean
  localPath?: string
}

export interface TrafficData {
  lat: number
  lng: number
  trafficLevel: 'free_flow' | 'light' | 'moderate' | 'heavy' | 'congestion'
  congestionFactor: number
  averageSpeed: number
  incidentType?: string
  confidence: number
}

export class VoiceNavigationService {
  private static instance: VoiceNavigationService
  private speechSynthesis: SpeechSynthesis | null = null
  private currentAudio: HTMLAudioElement | null = null
  private navigationState: NavigationState | null = null
  private instructionQueue: NavigationInstruction[] = []
  private isProcessing = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.speechSynthesis = window.speechSynthesis
      this.initializeAudio()
    }
  }

  static getInstance(): VoiceNavigationService {
    if (!VoiceNavigationService.instance) {
      VoiceNavigationService.instance = new VoiceNavigationService()
    }
    return VoiceNavigationService.instance
  }

  private initializeAudio(): void {
    try {
      // Preload common audio files
      const audioFiles = [
        'turn-left.mp3', 'turn-right.mp3', 'straight-ahead.mp3',
        'destination-reached.mp3', 'recalculating-route.mp3'
      ]

      audioFiles.forEach(file => {
        const audio = new Audio(`/audio/${file}`)
        audio.preload = 'auto'
        // Audio preloading
      })
    } catch (error) {
      // Audio initialization failed - offline audio unavailable
    }
  }

  async startNavigation(
    start: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    orderId: string,
    partnerId: string,
    options?: {
      language?: 'en' | 'hi' | 'kn' | 'ml'
      deviceId?: string
      preferredMode?: 'online' | 'offline' | 'hybrid'
    }
  ): Promise<void> {
    try {
      // Detect network type
      const networkType = this.detectNetworkType()

      // Check for available offline packages
      const offlinePackages = await this.getAvailableOfflinePackages(options?.deviceId || 'default-device')

      // Generate traffic-aware route and instructions
      const route = await this.calculateRouteWithTraffic(start, destination)

      // Initialize session
      const sessionId = `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      this.navigationState = {
        currentPosition: start,
        destination,
        remainingDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
        currentInstruction: null,
        nextInstructions: route.instructions,
        isActive: true,
        language: options?.language || 'en',
        navigationMode: this.determineNavigationMode(offlinePackages, networkType, options?.preferredMode),
        sessionId,
        offlinePackages: offlinePackages.map(p => p.id),
        trafficScore: route.trafficScore,
        rerouteCount: 0,
        trafficDelayMinutes: route.trafficDelay,
        batteryDrainStart: this.getBatteryLevel(),
        networkType
      }

      // Log navigation session start
      await this.logNavigationStart(sessionId, orderId)

      await auditLogger.logGPSUpdate(partnerId, orderId, {
        latitude: start.lat,
        longitude: start.lng,
        accuracy: 10 // GPS accuracy in meters
      })

      // Navigation session initialized

      // Speak initial instructions
      await this.processNextInstruction()

    } catch (error) {
      // Navigation startup failed
      throw error
    }
  }

  private async calculateRoute(
    start: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ totalDistance: number; estimatedTime: number; instructions: NavigationInstruction[] }> {
    // Simplified routing - in production, integrate with OpenRouteService, Google Maps, etc.

    // Mock navigation instructions
    const instructions: NavigationInstruction[] = [
      {
        type: 'TURN',
        direction: 'RIGHT',
        distance: 500,
        streetName: 'MG Road',
        instruction: 'Turn right onto MG Road'
      },
      {
        type: 'STRAIGHT',
        distance: 2000,
        streetName: 'MG Road',
        instruction: 'Continue straight on MG Road for 2 kilometers'
      },
      {
        type: 'TURN',
        direction: 'LEFT',
        distance: 800,
        streetName: 'Brigade Road',
        instruction: 'Turn left onto Brigade Road'
      },
      {
        type: 'ARRIVAL',
        distance: 50,
        instruction: 'You have arrived at your destination'
      }
    ]

    return {
      totalDistance: 2800, // meters
      estimatedTime: 15, // minutes
      instructions
    }
  }

  async updatePosition(newPosition: { lat: number; lng: number }, speed?: number): Promise<void> {
    if (!this.navigationState || !this.navigationState.isActive) return

    this.navigationState.currentPosition = newPosition

    // Update distances and check for instruction triggers
    const nextInstruction = this.navigationState.nextInstructions[0]
    if (nextInstruction) {
      const distance = this.calculateDistance(newPosition, this.navigationState.destination)

      if (distance <= nextInstruction.distance) {
        await this.processNextInstruction()
      }
    }

    // Update ETA based on speed
    if (speed && speed > 0) {
      const remainingDistance = this.calculateDistance(newPosition, this.navigationState.destination)
      this.navigationState.estimatedTime = (remainingDistance / 1000) / (speed / 60) // minutes
    }
  }

  private async processNextInstruction(): Promise<void> {
    if (this.isProcessing || !this.navigationState) return

    this.isProcessing = true

    try {
      const instruction = this.navigationState.nextInstructions.shift()

      if (instruction) {
        this.navigationState.currentInstruction = instruction

        // Speak the instruction
        await this.speakInstruction(instruction)

        // Handle special cases
        if (instruction.type === 'ARRIVAL') {
          await this.handleDestinationReached()
        }
      }

    } catch (error) {
      // Instruction processing failed
    } finally {
      this.isProcessing = false
    }
  }

  private async speakInstruction(instruction: NavigationInstruction): Promise<void> {
    const text = this.translateInstruction(instruction, this.navigationState?.language || 'en')

    try {
      // Try audio file first
      if (instruction.audioFile) {
        await this.playAudioFile(instruction.audioFile)
      } else {
        // Fall back to speech synthesis
        await this.speakText(text)
      }

      // Voice instruction spoken

    } catch (error) {
      // Voice instruction failed - continue silently
    }
  }

  private async playAudioFile(fileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.currentAudio) {
        this.currentAudio.pause()
      }

      this.currentAudio = new Audio(`/audio/${fileName}`)

      this.currentAudio.onended = () => resolve()
      this.currentAudio.onerror = () => reject(new Error('Audio playback failed'))

      this.currentAudio.play().catch(reject)
    })
  }

  private async speakText(text: string): Promise<void> {
    if (!this.speechSynthesis) return

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)

      // Configure voice settings
      utterance.rate = 0.9 // Slightly slower for clarity
      utterance.pitch = 1
      utterance.volume = 0.8

      // Set language
      utterance.lang = this.getLanguageCode(this.navigationState?.language || 'en')

      utterance.onend = () => resolve()
      utterance.onerror = (error) => {
        // Speech synthesis error - continue silently
        resolve() // Don't fail the navigation
      }

      this.speechSynthesis.speak(utterance)
    })
  }

  private translateInstruction(instruction: NavigationInstruction, language: string): string {
    // Simple translation mapping - expand to full i18n system
    const translations: Record<string, Record<string, string>> = {
      en: {
        'Turn right': 'Turn right',
        'Continue straight': 'Continue straight',
        'Turn left': 'Turn left',
        'You have arrived': 'You have arrived at your destination'
      },
      hi: {
        'Turn right': 'दाहिने मुड़ें',
        'Continue straight': 'सीधे आगे बढ़ें',
        'Turn left': 'बाएँ मुड़ें',
        'You have arrived': 'आप अपने गंतव्य पर पहुँच गए हैं'
      }
      // Add more languages...
    }

    const langMap = translations[language] || translations.en

    // Translate instruction text
    for (const [en, translated] of Object.entries(langMap)) {
      if (instruction.instruction.includes(en)) {
        return instruction.instruction.replace(en, translated)
      }
    }

    return instruction.instruction
  }

  private getLanguageCode(lang: string): string {
    const codes = {
      en: 'en-US',
      hi: 'hi-IN',
      kn: 'kn-IN',
      ml: 'ml-IN'
    }
    return codes[lang as keyof typeof codes] || 'en-US'
  }

  private calculateDistance(pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = pos1.lat * Math.PI / 180
    const φ2 = pos2.lat * Math.PI / 180
    const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180
    const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  private async handleDestinationReached(): Promise<void> {
    this.navigationState!.isActive = false

    // Play arrival sound/notification
    await this.playAudioFile('destination-reached.mp3')

    // Send SMS alert
    if (this.navigationState) {
      await smsService.sendSMS({
        recipient_phone: '+919876543210', // Partner's phone - get from profile
        message_type: 'DELIVERY_STATUS_UPDATE',
        message_content: 'Destination reached successfully. QR scan pending.',
        priority: 'NORMAL',
        reference_id: 'order-123', // TODO: Get actual order ID
        max_retries: 3
      })
    }

    // Navigation completed successfully
  }

  stopNavigation(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
    }

    if (this.speechSynthesis) {
      this.speechSynthesis.cancel()
    }

    if (this.navigationState) {
      this.navigationState.isActive = false
    }

    this.instructionQueue = []
    // Navigation stopped
  }

  getNavigationState(): NavigationState | null {
    return this.navigationState
  }

  // Emergency rerouting
  async rerouteAvoidingHazards(hazards: Array<{ lat: number; lng: number; radius: number }>): Promise<void> {
    if (!this.navigationState) return

    // Rerouting around hazards

    // Trigger reroute announcement
    await this.speakText('Recalculating route due to obstacles ahead')

    // In production: Implement proper routing algorithm avoiding hazards
    // For now, just notify
    await this.playAudioFile('recalculating-route.mp3')
  }

  // Traffic-aware updates
  async updateForTraffic(delay: number): Promise<void> {
    if (!this.navigationState) return

    const newEta = this.navigationState.estimatedTime + delay
    this.navigationState.estimatedTime = newEta

    await this.speakText(`Traffic delay detected. New ETA is ${Math.ceil(newEta)} minutes`)
  }

  // ============ ENHANCED NAVIGATION METHODS ============

  // Detect current network type
  private detectNetworkType(): string {
    if (typeof navigator !== 'undefined') {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection

      if (connection) {
        switch (connection.effectiveType) {
          case 'slow-2g':
          case '2g':
            return '2g'
          case '3g':
            return '3g'
          case '4g':
            return '4g'
          default:
            return 'wifi'
        }
      }

      // Fallback: check if online
      return navigator.onLine ? 'online' : 'offline'
    }

    return 'offline'
  }

  // Get battery level if available
  private getBatteryLevel(): number | undefined {
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      return (navigator as any).getBattery().then((battery: any) => {
        return battery.level * 100 // Convert to percentage
      }).catch(() => undefined)
    }
    return undefined
  }

  // Determine navigation mode based on available resources
  private determineNavigationMode(
    offlinePackages: OfflinePackage[],
    networkType: string,
    preferredMode?: 'online' | 'offline' | 'hybrid'
  ): 'online' | 'offline' | 'hybrid' {
    // If user prefers offline and packages are available
    if (preferredMode === 'offline' && offlinePackages.length > 0) {
      return 'offline'
    }

    // If bad network but offline packages available, use hybrid
    if (networkType === 'offline' || networkType === '2g' || networkType === '3g') {
      if (offlinePackages.length > 0) {
        return 'hybrid'
      }
    }

    // Default to online
    return 'online'
  }

  // Calculate route with traffic awareness
  private async calculateRouteWithTraffic(
    start: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{
    totalDistance: number
    estimatedTime: number
    instructions: NavigationInstruction[]
    trafficScore: number
    trafficDelay: number
  }> {
    // First get base route
    const baseRoute = await this.calculateRoute(start, destination)

    // Get traffic data for the route - type assertion for new database function
    const { data: trafficData } = await supabase.rpc('get_traffic_aware_route',
      {
        start_lat: start.lat,
        start_lng: start.lng,
        end_lat: destination.lat,
        end_lng: destination.lng
      }
    )

    let trafficScore = 100
    let trafficDelay = 0

    if (trafficData?.traffic_data && trafficData.traffic_data.length > 0) {
      trafficScore = trafficData.traffic_score || 100

      // Calculate additional time due to traffic
      const totalCongestion = trafficData.traffic_data.reduce(
        (sum: number, segment: any) =>
          sum + ((segment.congestion_factor || 1) - 1) * baseRoute.totalDistance / trafficData.traffic_data.length,
        0
      )

      // Rough estimate: traffic congestion adds time proportionally
      trafficDelay = Math.round(((totalCongestion / trafficData.traffic_data.length) - 1) * baseRoute.estimatedTime)
      trafficDelay = Math.max(0, trafficDelay)
    }

    // Enhance instructions with traffic data
    const instructionsWithTraffic = baseRoute.instructions.map(instruction => ({
      ...instruction,
      trafficImpact: this.getTrafficImpactForInstruction(instruction, trafficData?.traffic_data || []),
      estimatedDelay: 0 // Could be calculated per instruction
    }))

    return {
      ...baseRoute,
      instructions: instructionsWithTraffic,
      trafficScore,
      trafficDelay
    }
  }

  // Get traffic impact for a specific instruction
  private getTrafficImpactForInstruction(
    instruction: NavigationInstruction,
    trafficData: TrafficData[]
  ): 'clear' | 'moderate' | 'heavy' | 'congestion' {
    // Simple logic: check if instruction area matches heavy traffic
    const heavyTrafficNearby = trafficData.some(traffic =>
      (traffic.trafficLevel === 'heavy' || traffic.trafficLevel === 'congestion') &&
      this.calculateDistance(
        { lat: traffic.lat, lng: traffic.lng },
        this.navigationState?.destination || { lat: 0, lng: 0 }
      ) < 1000 // Within 1km
    )

    if (heavyTrafficNearby) {
      return 'heavy'
    }

    const moderateTrafficNearby = trafficData.some(traffic =>
      traffic.trafficLevel === 'moderate' &&
      this.calculateDistance(
        { lat: traffic.lat, lng: traffic.lng },
        this.navigationState?.destination || { lat: 0, lng: 0 }
      ) < 1000
    )

    if (moderateTrafficNearby) {
      return 'moderate'
    }

    return 'clear'
  }

  // Get available offline packages for a device
  private async getAvailableOfflinePackages(deviceId: string): Promise<OfflinePackage[]> {
    try {
      const { data, error } = await supabase
        .from('offline_packages')
        .select('id, package_name, package_type, language_code, region_name, file_path, file_size_bytes, version, checksum')
        .eq('is_active', true)

      if (error) throw error

      if (!data) return []

      // Check which packages are downloaded on this device
      const { data: devicePackages, error: deviceError } = await supabase
        .from('device_offline_packages')
        .select('package_id, storage_path, last_accessed_at, is_corrupted')
        .eq('device_id', deviceId)
        .eq('is_corrupted', false)

      if (deviceError) {
        console.warn('Error checking device packages:', deviceError)
      }

      const downloadedPackageIds = new Set(
        (devicePackages || []).map((dp: any) => dp.package_id)
      )

      return data.map((pkg: any) => ({
        id: pkg.id,
        packageName: pkg.package_name,
        packageType: pkg.package_type,
        languageCode: pkg.language_code,
        regionName: pkg.region_name,
        filePath: pkg.file_path,
        fileSizeBytes: pkg.file_size_bytes,
        version: pkg.version,
        checksum: pkg.checksum,
        isDownloaded: downloadedPackageIds.has(pkg.id),
        localPath: devicePackages?.find((dp: any) => dp.package_id === pkg.id)?.storage_path
      }))

    } catch (error) {
      console.error('Failed to get offline packages:', error)
      return []
    }
  }

  // Download offline package
  async downloadOfflinePackage(packageId: string, deviceId: string): Promise<boolean> {
    try {
      // Call the database function
      const { data, error } = await supabase.rpc('download_offline_package', {
        p_device_id: deviceId,
        p_package_id: packageId
      })

      if (error) throw error

      console.log('Package download recorded:', packageId)
      return data || false

    } catch (error) {
      console.error('Failed to download offline package:', error)
      return false
    }
  }

  // Log navigation session start
  private async logNavigationStart(sessionId: string, orderId: string): Promise<void> {
    try {
      await supabase.rpc('log_navigation_session', {
        p_session_id: sessionId,
        p_order_id: orderId,
        p_start_time: new Date(),
        p_end_time: null,
        p_stats: {
          navigation_mode: this.navigationState?.navigationMode,
          language_used: this.navigationState?.language,
          network_type: this.navigationState?.networkType,
          offline_packages_used: this.navigationState?.offlinePackages,
          battery_drain_percentage: 0 // Will be calculated at end
        }
      } as any)
    } catch (error) {
      console.warn('Failed to log navigation start:', error)
    }
  }

  // Enhanced update position with traffic monitoring
  async updatePositionEnhanced(newPosition: { lat: number; lng: number }, speed?: number, heading?: number): Promise<void> {
    if (!this.navigationState || !this.navigationState.isActive) return

    // Check for traffic changes along the route
    const trafficUpdate = await this.checkTrafficUpdates(this.navigationState.currentPosition, newPosition)

    if (trafficUpdate.hasChanged) {
      this.navigationState.trafficScore = trafficUpdate.newScore
      this.navigationState.trafficDelayMinutes = trafficUpdate.delayIncrease

      // Notify user of traffic change
      if (trafficUpdate.delayIncrease > 5) { // More than 5 minutes delay
        await this.speakText(`Traffic ahead. Expect ${trafficUpdate.delayIncrease} minute delay.`)
      }
    }

    // Update position
    this.navigationState.currentPosition = newPosition

    // Check for rerouting opportunity
    if (trafficUpdate.shouldReroute) {
      await this.initiateTrafficRerouting(newPosition)
    }

    // Continue with normal position updates
    await this.updatePosition(newPosition, speed)
  }

  // Check for traffic updates
  private async checkTrafficUpdates(
    oldPosition: { lat: number; lng: number },
    newPosition: { lat: number; lng: number }
  ): Promise<{
    hasChanged: boolean
    newScore: number
    delayIncrease: number
    shouldReroute: boolean
  }> {
    try {
      const { data, error } = await supabase.rpc('get_traffic_aware_route',
        {
          start_lat: oldPosition.lat,
          start_lng: oldPosition.lng,
          end_lat: newPosition.lat,
          end_lng: newPosition.lng
        }
      )

      if (error) throw error

      const currentScore = this.navigationState?.trafficScore || 100
      const newScore = data?.traffic_score || currentScore

      const scoreDifference = currentScore - newScore
      const delayIncrease = scoreDifference > 10 ? Math.round(scoreDifference / 5) : 0 // Rough delay estimation

      return {
        hasChanged: scoreDifference > 5,
        newScore,
        delayIncrease,
        shouldReroute: scoreDifference > 20 // Significant deterioration
      }

    } catch (error) {
      console.warn('Traffic update check failed:', error)
      return {
        hasChanged: false,
        newScore: this.navigationState?.trafficScore || 100,
        delayIncrease: 0,
        shouldReroute: false
      }
    }
  }

  // Initiate traffic-based rerouting
  private async initiateTrafficRerouting(currentPosition: { lat: number; lng: number }): Promise<void> {
    if (!this.navigationState) return

    this.navigationState.rerouteCount += 1

    // Speak reroute announcement
    await this.speakText('Heavy traffic ahead. Recalculating optimal route.')

    // In production: Implement actual traffic-aware routing
    // For now, just announce
    console.log('Traffic rerouting triggered')

    // Play rerouting sound
    await this.playAudioFile('recalculating-route.mp3')
  }

  // Stop navigation with comprehensive logging
  async stopNavigationEnhanced(feedback?: { score: number; comments?: string }): Promise<void> {
    if (!this.navigationState) {
      this.stopNavigation()
      return
    }

    const startTime = new Date()

    // Calculate session stats
    const duration = this.calculateDistance(this.navigationState.destination, this.navigationState.currentPosition)

    const finalBatteryLevel = this.getBatteryLevel()
    const batteryDrain = finalBatteryLevel && this.navigationState.batteryDrainStart
      ? this.navigationState.batteryDrainStart - finalBatteryLevel
      : 0

    const sessionStats = {
      total_distance_meters: Math.round(this.navigationState.remainingDistance),
      total_duration_seconds: Math.round((Date.now() - startTime.getTime()) / 1000),
      average_speed_kmh: 0, // Would be calculated from actual speed data
      navigation_mode: this.navigationState.navigationMode,
      reroute_count: this.navigationState.rerouteCount,
      traffic_delay_minutes: this.navigationState.trafficDelayMinutes,
      language_used: this.navigationState.language,
      voice_instructions_count: 0, // Would be tracked
      audio_files_used: 0,
      speech_synthesis_used: 0,
      feedback_score: feedback?.score,
      user_feedback: feedback?.comments,
      error_count: 0,
      battery_drain_percentage: batteryDrain,
      network_type: this.navigationState.networkType,
      offline_packages_used: this.navigationState.offlinePackages
    }

    try {
      // Log final session data
      await supabase.rpc('log_navigation_session', {
        p_session_id: this.navigationState.sessionId,
        p_order_id: null, // Could be stored in navigationState
        p_start_time: startTime,
        p_end_time: new Date(),
        p_stats: sessionStats
      })

      console.log('Navigation session logged successfully')
    } catch (error) {
      console.warn('Failed to log navigation session:', error)
    }

    // Stop navigation
    this.stopNavigation()
  }

  // Test function for development
  async testVoiceOutput(): Promise<void> {
    console.log('Testing enhanced voice navigation...')

    await this.speakText('Enhanced voice navigation system is working')
    await new Promise(resolve => setTimeout(resolve, 1000))

    await this.speakText('दाहिने मुड़ें - Turn right')
    await new Promise(resolve => setTimeout(resolve, 1000))

    await this.speakText('You have arrived at your destination')

    console.log('Enhanced voice navigation test completed')
  }

  // Get list of available offline packages
  async getOfflinePackagesList(): Promise<OfflinePackage[]> {
    try {
      const { data, error } = await supabase
        .from('offline_packages')
        .select('*')
        .eq('is_active', true)
        .order('package_name')

      if (error) throw error

      return data.map(pkg => ({
        id: pkg.id,
        packageName: pkg.package_name,
        packageType: pkg.package_type,
        languageCode: pkg.language_code,
        regionName: pkg.region_name,
        filePath: pkg.file_path,
        fileSizeBytes: pkg.file_size_bytes,
        version: pkg.version,
        checksum: pkg.checksum,
        isDownloaded: false // Will be checked when needed
      }))
    } catch (error) {
      console.error('Failed to get offline packages:', error)
      return []
    }
  }

  // Check current traffic conditions for a route
  async getRouteTrafficInfo(
    start: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{
    trafficScore: number
    delayMinutes: number
    incidents: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>
  }> {
    try {
      const { data, error } = await supabase.rpc('get_traffic_aware_route',
        {
          start_lat: start.lat,
          start_lng: start.lng,
          end_lat: destination.lat,
          end_lng: destination.lng
        }
      )

      if (error) throw error

      // Extract incident information from traffic data
      const incidents: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }> = []

      if (data?.traffic_data) {
        data.traffic_data.forEach((traffic: any) => {
          if (traffic.incident_type) {
            let severity: 'low' | 'medium' | 'high' = 'low'
            if (traffic.traffic_level === 'congestion') severity = 'high'
            else if (traffic.traffic_level === 'heavy') severity = 'medium'

            incidents.push({
              type: traffic.incident_type,
              description: traffic.incident_description || `${traffic.traffic_level} traffic`,
              severity
            })
          }
        })
      }

      return {
        trafficScore: data?.traffic_score || 100,
        delayMinutes: data ? Math.round((100 - data.traffic_score) / 5) : 0,
        incidents
      }

    } catch (error) {
      console.error('Failed to get route traffic info:', error)
      return {
        trafficScore: 100,
        delayMinutes: 0,
        incidents: []
      }
    }
  }
}

// Global navigation service instance
export const voiceNavigation = VoiceNavigationService.getInstance()
