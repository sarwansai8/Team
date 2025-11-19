// Behavioral Biometrics Engine - Continuous User Authentication
// Analyzes typing patterns, mouse behavior, and interaction rhythms

export interface KeystrokeMetrics {
  key: string
  dwellTime: number // Time key held down
  flightTime: number // Time between this key and previous key
  timestamp: number
}

export interface MouseMetrics {
  x: number
  y: number
  velocity: number
  acceleration: number
  timestamp: number
  angle: number
}

export interface BiometricProfile {
  userId?: string
  keystrokePattern: {
    avgDwellTime: number
    avgFlightTime: number
    dwellTimeStdDev: number
    flightTimeStdDev: number
    typingSpeed: number // WPM
    commonDigraphs: Map<string, number> // Key pair timings
  }
  mousePattern: {
    avgVelocity: number
    avgAcceleration: number
    curveComplexity: number
    clickDuration: number
    doubleClickSpeed: number
    movementJitter: number
  }
  touchPattern: {
    avgPressure: number
    avgTouchArea: number
    swipeVelocity: number
    tapDuration: number
  }
  interactionRhythm: {
    avgScrollSpeed: number
    pauseDuration: number
    taskCompletionTime: number
    errorRate: number
  }
}

export interface BiometricScore {
  isHuman: boolean
  confidence: number // 0-100
  score: number // 0-100 (100 = most human-like)
  anomalies: string[]
  recommendation: 'allow' | 'challenge' | 'block'
  profile: Partial<BiometricProfile>
}

class BehavioralBiometricsEngine {
  private keystrokeBuffer: KeystrokeMetrics[] = []
  private mouseBuffer: MouseMetrics[] = []
  private lastKeyDown: { key: string; timestamp: number } | null = null
  private lastMousePos: { x: number; y: number; timestamp: number } | null = null
  private lastMouseVelocity: number = 0
  private scrollEvents: number[] = []
  private clickTimestamps: number[] = []
  private lastClickTime: number = 0
  private focusChanges: number = 0
  private errors: number = 0 // Backspace count
  private sessionStart: number = Date.now()

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeTracking()
    }
  }

  /**
   * Initialize comprehensive behavioral tracking
   */
  private initializeTracking(): void {
    // Keystroke dynamics
    document.addEventListener('keydown', (e) => {
      const now = Date.now()
      this.lastKeyDown = { key: e.key, timestamp: now }

      // Track errors (backspace usage)
      if (e.key === 'Backspace') {
        this.errors++
      }
    })

    document.addEventListener('keyup', (e) => {
      const now = Date.now()
      
      if (this.lastKeyDown && this.lastKeyDown.key === e.key) {
        const dwellTime = now - this.lastKeyDown.timestamp
        
        // Calculate flight time (time between this key and previous different key)
        const flightTime = this.keystrokeBuffer.length > 0
          ? this.lastKeyDown.timestamp - this.keystrokeBuffer[this.keystrokeBuffer.length - 1].timestamp
          : 0

        this.keystrokeBuffer.push({
          key: e.key,
          dwellTime,
          flightTime,
          timestamp: now
        })

        // Keep only last 100 keystrokes
        if (this.keystrokeBuffer.length > 100) {
          this.keystrokeBuffer.shift()
        }
      }
    })

    // Mouse dynamics
    document.addEventListener('mousemove', (e) => {
      const now = Date.now()

      if (this.lastMousePos) {
        const dx = e.clientX - this.lastMousePos.x
        const dy = e.clientY - this.lastMousePos.y
        const dt = (now - this.lastMousePos.timestamp) / 1000 // seconds
        
        const distance = Math.sqrt(dx * dx + dy * dy)
        const velocity = dt > 0 ? distance / dt : 0
        const acceleration = velocity - this.lastMouseVelocity
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)

        this.mouseBuffer.push({
          x: e.clientX,
          y: e.clientY,
          velocity,
          acceleration,
          timestamp: now,
          angle
        })

        this.lastMouseVelocity = velocity

        // Keep only last 100 movements
        if (this.mouseBuffer.length > 100) {
          this.mouseBuffer.shift()
        }
      }

      this.lastMousePos = { x: e.clientX, y: e.clientY, timestamp: now }
    })

    // Click timing
    document.addEventListener('mousedown', () => {
      this.lastClickTime = Date.now()
    })

    document.addEventListener('mouseup', () => {
      const now = Date.now()
      this.clickTimestamps.push(now)

      // Keep only last 20 clicks
      if (this.clickTimestamps.length > 20) {
        this.clickTimestamps.shift()
      }
    })

    // Scroll behavior
    document.addEventListener('scroll', () => {
      this.scrollEvents.push(Date.now())
      
      // Keep only last 50 scroll events
      if (this.scrollEvents.length > 50) {
        this.scrollEvents.shift()
      }
    })

    // Focus changes
    document.addEventListener('focus', () => {
      this.focusChanges++
    }, true)
  }

  /**
   * Analyze keystroke dynamics
   */
  private analyzeKeystrokeDynamics(): { score: number; anomalies: string[] } {
    const anomalies: string[] = []
    let score = 100

    if (this.keystrokeBuffer.length < 10) {
      return { score, anomalies } // Not enough data
    }

    // Calculate average dwell time
    const avgDwellTime = this.keystrokeBuffer.reduce((sum, k) => sum + k.dwellTime, 0) / this.keystrokeBuffer.length

    // Human dwell time: 50-200ms typically
    if (avgDwellTime < 30) {
      anomalies.push('Keystroke dwell time too short (bot-like)')
      score -= 30
    } else if (avgDwellTime > 300) {
      anomalies.push('Keystroke dwell time too long (suspicious)')
      score -= 15
    }

    // Calculate average flight time
    const flightTimes = this.keystrokeBuffer.map(k => k.flightTime).filter(t => t > 0)
    const avgFlightTime = flightTimes.reduce((sum, t) => sum + t, 0) / flightTimes.length

    // Human flight time: 100-400ms typically
    if (avgFlightTime < 50) {
      anomalies.push('Keystroke flight time too short (robotic)')
      score -= 35
    }

    // Check for consistent timing (bot indicator)
    const dwellTimeStdDev = this.calculateStdDev(this.keystrokeBuffer.map(k => k.dwellTime))
    if (dwellTimeStdDev < 10) {
      anomalies.push('Keystroke timing too consistent (automated)')
      score -= 40
    }

    // Check typing speed
    const timeSpan = (this.keystrokeBuffer[this.keystrokeBuffer.length - 1].timestamp - 
                     this.keystrokeBuffer[0].timestamp) / 1000 // seconds
    const typingSpeed = (this.keystrokeBuffer.length / timeSpan) * 60 / 5 // WPM (5 chars per word)

    if (typingSpeed > 120) {
      anomalies.push(`Typing speed suspiciously fast: ${Math.round(typingSpeed)} WPM`)
      score -= 25
    }

    return { score: Math.max(score, 0), anomalies }
  }

  /**
   * Analyze mouse dynamics
   */
  private analyzeMouseDynamics(): { score: number; anomalies: string[] } {
    const anomalies: string[] = []
    let score = 100

    if (this.mouseBuffer.length < 20) {
      return { score, anomalies } // Not enough data
    }

    // Calculate average velocity
    const avgVelocity = this.mouseBuffer.reduce((sum, m) => sum + m.velocity, 0) / this.mouseBuffer.length

    // Human mouse velocity: 200-2000 px/s typically
    if (avgVelocity < 50) {
      anomalies.push('Mouse velocity too slow (bot-like)')
      score -= 25
    } else if (avgVelocity > 5000) {
      anomalies.push('Mouse velocity unrealistically high')
      score -= 30
    }

    // Check for linear movements (bot indicator)
    const angleChanges = []
    for (let i = 1; i < this.mouseBuffer.length; i++) {
      const angleDiff = Math.abs(this.mouseBuffer[i].angle - this.mouseBuffer[i - 1].angle)
      angleChanges.push(angleDiff)
    }
    const avgAngleChange = angleChanges.reduce((sum, a) => sum + a, 0) / angleChanges.length

    if (avgAngleChange < 5) {
      anomalies.push('Mouse movements too linear (automated)')
      score -= 35
    }

    // Check for curve complexity (humans make curves)
    const accelerations = this.mouseBuffer.map(m => Math.abs(m.acceleration))
    const avgAcceleration = accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length

    if (avgAcceleration < 10) {
      anomalies.push('Mouse movements lack natural curves')
      score -= 20
    }

    // Check for jitter (humans have natural hand tremor)
    const velocityStdDev = this.calculateStdDev(this.mouseBuffer.map(m => m.velocity))
    if (velocityStdDev < 50) {
      anomalies.push('Mouse movements too smooth (no natural jitter)')
      score -= 25
    }

    return { score: Math.max(score, 0), anomalies }
  }

  /**
   * Analyze click behavior
   */
  private analyzeClickBehavior(): { score: number; anomalies: string[] } {
    const anomalies: string[] = []
    let score = 100

    if (this.clickTimestamps.length < 3) {
      return { score, anomalies }
    }

    // Check for double-click patterns
    const clickIntervals = []
    for (let i = 1; i < this.clickTimestamps.length; i++) {
      clickIntervals.push(this.clickTimestamps[i] - this.clickTimestamps[i - 1])
    }

    // Perfect timing is suspicious
    const clickIntervalStdDev = this.calculateStdDev(clickIntervals)
    if (clickIntervalStdDev < 10) {
      anomalies.push('Click timing too consistent (automated)')
      score -= 35
    }

    // Check for rapid repeated clicks (bot behavior)
    const rapidClicks = clickIntervals.filter(interval => interval < 100).length
    if (rapidClicks > clickIntervals.length * 0.5) {
      anomalies.push('Too many rapid clicks (bot-like)')
      score -= 30
    }

    return { score: Math.max(score, 0), anomalies }
  }

  /**
   * Analyze interaction rhythm
   */
  private analyzeInteractionRhythm(): { score: number; anomalies: string[] } {
    const anomalies: string[] = []
    let score = 100
    const sessionDuration = (Date.now() - this.sessionStart) / 1000 // seconds

    if (sessionDuration < 5) {
      return { score, anomalies } // Too early to analyze
    }

    // Check scroll behavior
    if (this.scrollEvents.length === 0 && sessionDuration > 10) {
      anomalies.push('No scroll events detected')
      score -= 20
    }

    // Check error rate (humans make typos)
    const errorRate = this.keystrokeBuffer.length > 0 
      ? this.errors / this.keystrokeBuffer.length 
      : 0

    if (errorRate === 0 && this.keystrokeBuffer.length > 50) {
      anomalies.push('Zero errors detected (unusually perfect)')
      score -= 25
    } else if (errorRate > 0.3) {
      anomalies.push('Error rate unusually high')
      score -= 15
    }

    // Check for interaction diversity
    const hasKeystrokes = this.keystrokeBuffer.length > 0
    const hasMouseMovement = this.mouseBuffer.length > 0
    const hasClicks = this.clickTimestamps.length > 0
    const hasScrolls = this.scrollEvents.length > 0

    const interactionTypes = [hasKeystrokes, hasMouseMovement, hasClicks, hasScrolls].filter(Boolean).length

    if (interactionTypes < 2 && sessionDuration > 10) {
      anomalies.push('Limited interaction diversity (bot-like)')
      score -= 30
    }

    return { score: Math.max(score, 0), anomalies }
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    
    return Math.sqrt(variance)
  }

  /**
   * Generate comprehensive biometric score
   */
  async generateScore(): Promise<BiometricScore> {
    const keystrokeAnalysis = this.analyzeKeystrokeDynamics()
    const mouseAnalysis = this.analyzeMouseDynamics()
    const clickAnalysis = this.analyzeClickBehavior()
    const rhythmAnalysis = this.analyzeInteractionRhythm()

    // Weighted average
    const overallScore = (
      keystrokeAnalysis.score * 0.3 +
      mouseAnalysis.score * 0.35 +
      clickAnalysis.score * 0.15 +
      rhythmAnalysis.score * 0.2
    )

    const allAnomalies = [
      ...keystrokeAnalysis.anomalies,
      ...mouseAnalysis.anomalies,
      ...clickAnalysis.anomalies,
      ...rhythmAnalysis.anomalies
    ]

    const confidence = Math.min(
      (this.keystrokeBuffer.length + this.mouseBuffer.length) / 2,
      100
    )

    const isHuman = overallScore >= 50
    const recommendation = overallScore >= 70 ? 'allow' : 
                          overallScore >= 40 ? 'challenge' : 'block'

    return {
      isHuman,
      confidence,
      score: overallScore,
      anomalies: allAnomalies,
      recommendation,
      profile: this.buildProfile()
    }
  }

  /**
   * Build biometric profile
   */
  private buildProfile(): Partial<BiometricProfile> {
    const avgDwellTime = this.keystrokeBuffer.length > 0
      ? this.keystrokeBuffer.reduce((sum, k) => sum + k.dwellTime, 0) / this.keystrokeBuffer.length
      : 0

    const flightTimes = this.keystrokeBuffer.map(k => k.flightTime).filter(t => t > 0)
    const avgFlightTime = flightTimes.length > 0
      ? flightTimes.reduce((sum, t) => sum + t, 0) / flightTimes.length
      : 0

    const avgVelocity = this.mouseBuffer.length > 0
      ? this.mouseBuffer.reduce((sum, m) => sum + m.velocity, 0) / this.mouseBuffer.length
      : 0

    const avgAcceleration = this.mouseBuffer.length > 0
      ? this.mouseBuffer.reduce((sum, m) => sum + Math.abs(m.acceleration), 0) / this.mouseBuffer.length
      : 0

    return {
      keystrokePattern: {
        avgDwellTime,
        avgFlightTime,
        dwellTimeStdDev: this.calculateStdDev(this.keystrokeBuffer.map(k => k.dwellTime)),
        flightTimeStdDev: this.calculateStdDev(flightTimes),
        typingSpeed: 0,
        commonDigraphs: new Map()
      },
      mousePattern: {
        avgVelocity,
        avgAcceleration,
        curveComplexity: 0,
        clickDuration: 0,
        doubleClickSpeed: 0,
        movementJitter: this.calculateStdDev(this.mouseBuffer.map(m => m.velocity))
      },
      touchPattern: {
        avgPressure: 0,
        avgTouchArea: 0,
        swipeVelocity: 0,
        tapDuration: 0
      },
      interactionRhythm: {
        avgScrollSpeed: 0,
        pauseDuration: 0,
        taskCompletionTime: (Date.now() - this.sessionStart) / 1000,
        errorRate: this.keystrokeBuffer.length > 0 ? this.errors / this.keystrokeBuffer.length : 0
      }
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      keystrokeCount: this.keystrokeBuffer.length,
      mouseMovementCount: this.mouseBuffer.length,
      clickCount: this.clickTimestamps.length,
      scrollCount: this.scrollEvents.length,
      errorCount: this.errors,
      sessionDuration: (Date.now() - this.sessionStart) / 1000,
      focusChanges: this.focusChanges
    }
  }

  /**
   * Reset tracking
   */
  reset(): void {
    this.keystrokeBuffer = []
    this.mouseBuffer = []
    this.lastKeyDown = null
    this.lastMousePos = null
    this.lastMouseVelocity = 0
    this.scrollEvents = []
    this.clickTimestamps = []
    this.lastClickTime = 0
    this.focusChanges = 0
    this.errors = 0
    this.sessionStart = Date.now()
  }
}

// Singleton instance
let biometricsInstance: BehavioralBiometricsEngine | null = null

export function getBehavioralBiometrics(): BehavioralBiometricsEngine {
  if (typeof window === 'undefined') {
    throw new Error('BehavioralBiometricsEngine can only be used in browser')
  }
  
  if (!biometricsInstance) {
    biometricsInstance = new BehavioralBiometricsEngine()
  }
  
  return biometricsInstance
}

export { BehavioralBiometricsEngine }
