// Advanced Bot Detection & Device Fingerprinting System
// Military-grade bot detection with Canvas, WebGL, Audio fingerprinting

export interface DeviceFingerprint {
  id: string
  canvas: string
  webgl: string
  audio: string
  fonts: string[]
  plugins: string[]
  timezone: string
  language: string
  platform: string
  hardwareConcurrency: number
  deviceMemory?: number
  screenResolution: string
  colorDepth: number
  pixelRatio: number
  touchSupport: boolean
  webdriver: boolean
  browserAutomation: boolean
  timestamp: number
}

export interface BotDetectionResult {
  isBot: boolean
  confidence: number // 0-100
  reasons: string[]
  fingerprint: DeviceFingerprint
  threats: string[]
}

class BotDetectionService {
  private canvas: HTMLCanvasElement | null = null
  private audioContext: AudioContext | null = null

  /**
   * Generate Canvas Fingerprint
   * Each device renders canvas slightly differently
   */
  private generateCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return 'unavailable'

      canvas.width = 280
      canvas.height = 60

      // Draw complex shapes and text
      ctx.textBaseline = 'top'
      ctx.font = '14px "Arial"'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      
      ctx.fillStyle = '#069'
      ctx.fillText('BrowserLeaks,com 🔒', 2, 15)
      
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('BrowserLeaks,com 🔒', 4, 17)

      // Draw emojis (different on each system)
      ctx.fillText('🌈🔥💻🛡️', 50, 40)

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // Generate hash from pixel data
      let hash = 0
      for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data[i]
        hash = hash & hash // Convert to 32bit integer
      }

      return hash.toString(36)
    } catch (e) {
      return 'error'
    }
  }

  /**
   * Generate WebGL Fingerprint
   * GPU and driver information
   */
  private generateWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
      
      if (!gl) return 'unavailable'

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (!debugInfo) return 'no-debug-info'

      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      
      // Get additional WebGL parameters
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
      const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS)
      const shadingLanguage = gl.getParameter(gl.SHADING_LANGUAGE_VERSION)

      return `${vendor}|${renderer}|${maxTextureSize}|${maxViewport}|${shadingLanguage}`.substring(0, 100)
    } catch (e) {
      return 'error'
    }
  }

  /**
   * Generate Audio Context Fingerprint
   * Audio processing is unique per device
   */
  private async generateAudioFingerprint(): Promise<string> {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return 'unavailable'

      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const analyser = context.createAnalyser()
      const gainNode = context.createGain()
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1)

      gainNode.gain.value = 0 // Mute
      oscillator.type = 'triangle'
      oscillator.frequency.value = 10000

      oscillator.connect(analyser)
      analyser.connect(scriptProcessor)
      scriptProcessor.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.start(0)

      let isClosed = false

      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          if (isClosed) return
          
          const output = event.outputBuffer.getChannelData(0)
          let sum = 0
          for (let i = 0; i < output.length; i++) {
            sum += Math.abs(output[i])
          }
          
          try {
            oscillator.stop()
            if (context.state !== 'closed') {
              context.close().catch(() => {})
            }
            isClosed = true
          } catch (e) {
            // Ignore close errors
          }
          
          resolve(sum.toString(36).substring(0, 20))
        }

        // Timeout fallback
        setTimeout(() => {
          if (isClosed) return
          
          try {
            oscillator.stop()
            if (context.state !== 'closed') {
              context.close().catch(() => {})
            }
            isClosed = true
          } catch (e) {
            // Ignore close errors
          }
          resolve('timeout')
        }, 100)
      })
    } catch (e) {
      return 'error'
    }
  }

  /**
   * Get installed fonts (font fingerprinting)
   */
  private getInstalledFonts(): string[] {
    const baseFonts = ['monospace', 'sans-serif', 'serif']
    const testFonts = [
      'Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Trebuchet MS',
      'Verdana', 'Helvetica', 'Comic Sans MS', 'Impact', 'Palatino',
      'Garamond', 'Bookman', 'Avant Garde', 'Calibri', 'Cambria'
    ]

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const text = 'mmmmmmmmmmlli'
    const detectedFonts: string[] = []

    const baselineWidths: Record<string, number> = {}
    for (const baseFont of baseFonts) {
      ctx.font = `72px ${baseFont}`
      baselineWidths[baseFont] = ctx.measureText(text).width
    }

    for (const testFont of testFonts) {
      let detected = false
      for (const baseFont of baseFonts) {
        ctx.font = `72px "${testFont}", ${baseFont}`
        const width = ctx.measureText(text).width
        if (width !== baselineWidths[baseFont]) {
          detected = true
          break
        }
      }
      if (detected) detectedFonts.push(testFont)
    }

    return detectedFonts
  }

  /**
   * Detect browser automation tools
   */
  private detectBrowserAutomation(): { webdriver: boolean; automation: boolean; indicators: string[] } {
    const indicators: string[] = []
    let webdriver = false
    let automation = false

    // Check for webdriver
    if (navigator.webdriver) {
      webdriver = true
      indicators.push('navigator.webdriver=true')
    }

    // Check for common automation frameworks
    const automationProps = [
      '__webdriver_evaluate',
      '__selenium_evaluate',
      '__webdriver_script_function',
      '__webdriver_script_func',
      '__webdriver_script_fn',
      '__fxdriver_evaluate',
      '__driver_unwrapped',
      '__webdriver_unwrapped',
      '__driver_evaluate',
      '__selenium_unwrapped',
      '__fxdriver_unwrapped',
      '_Selenium_IDE_Recorder',
      '_selenium',
      'callSelenium',
      'callPhantom',
      '_phantom',
      '__nightmare',
      '__puppeteer_evaluation_script__',
      'domAutomation',
      'domAutomationController'
    ]

    for (const prop of automationProps) {
      if ((window as any)[prop] || (document as any)[prop]) {
        automation = true
        indicators.push(`${prop} detected`)
      }
    }

    // Check for Puppeteer
    if ((navigator as any).plugins?.length === 0 && navigator.language === '') {
      automation = true
      indicators.push('Puppeteer signature')
    }

    // Check for headless Chrome
    if (/HeadlessChrome/.test(navigator.userAgent)) {
      automation = true
      indicators.push('Headless Chrome detected')
    }

    // Check for PhantomJS
    if ((window as any).callPhantom || (window as any)._phantom) {
      automation = true
      indicators.push('PhantomJS detected')
    }

    // Check permissions
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'notifications' as PermissionName }).then((result) => {
        if (result.state === 'denied' && Notification.permission === 'default') {
          indicators.push('Permission mismatch (automation indicator)')
        }
      }).catch(() => {})
    }

    return { webdriver, automation, indicators }
  }

  /**
   * Generate complete device fingerprint
   */
  async generateFingerprint(): Promise<DeviceFingerprint> {
    const canvas = this.generateCanvasFingerprint()
    const webgl = this.generateWebGLFingerprint()
    const audio = await this.generateAudioFingerprint()
    const fonts = this.getInstalledFonts()
    const automation = this.detectBrowserAutomation()

    const fingerprint: DeviceFingerprint = {
      id: '', // Will be generated from hash
      canvas,
      webgl,
      audio,
      fonts,
      plugins: Array.from(navigator.plugins).map(p => p.name),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      webdriver: automation.webdriver,
      browserAutomation: automation.automation,
      timestamp: Date.now()
    }

    // Generate ID from all fingerprint data
    fingerprint.id = await this.hashFingerprint(fingerprint)

    return fingerprint
  }

  /**
   * Hash fingerprint data
   */
  private async hashFingerprint(fingerprint: DeviceFingerprint): Promise<string> {
    const data = JSON.stringify({
      canvas: fingerprint.canvas,
      webgl: fingerprint.webgl,
      audio: fingerprint.audio,
      fonts: fingerprint.fonts.join(','),
      platform: fingerprint.platform,
      screen: fingerprint.screenResolution
    })

    // Simple hash for browser compatibility
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    
    return Math.abs(hash).toString(36)
  }

  /**
   * Detect if current user is a bot
   */
  async detectBot(): Promise<BotDetectionResult> {
    const fingerprint = await this.generateFingerprint()
    const reasons: string[] = []
    const threats: string[] = []
    let botScore = 0

    // Check 1: WebDriver detection (strong indicator)
    if (fingerprint.webdriver) {
      botScore += 40
      reasons.push('WebDriver detected')
      threats.push('Browser automation tool')
    }

    // Check 2: Browser automation
    if (fingerprint.browserAutomation) {
      botScore += 35
      reasons.push('Automation framework detected')
      threats.push('Puppeteer/Selenium/Playwright')
    }

    // Check 3: Canvas fingerprint
    if (fingerprint.canvas === 'unavailable' || fingerprint.canvas === 'error') {
      botScore += 15
      reasons.push('Canvas rendering blocked/failed')
      threats.push('Headless browser')
    }

    // Check 4: WebGL fingerprint
    if (fingerprint.webgl === 'unavailable') {
      botScore += 10
      reasons.push('WebGL unavailable')
      threats.push('Headless environment')
    }

    // Check 5: No plugins (headless browsers)
    if (fingerprint.plugins.length === 0 && !fingerprint.touchSupport) {
      botScore += 15
      reasons.push('No browser plugins')
      threats.push('Headless Chrome')
    }

    // Check 6: Unusual screen resolution
    if (fingerprint.screenResolution === '0x0' || fingerprint.screenResolution === '800x600') {
      botScore += 10
      reasons.push('Suspicious screen resolution')
      threats.push('Virtual environment')
    }

    // Check 7: Hardware concurrency mismatch
    if (fingerprint.hardwareConcurrency === 0 || fingerprint.hardwareConcurrency > 128) {
      botScore += 10
      reasons.push('Unusual CPU core count')
    }

    // Check 8: Missing modern browser features
    if (!fingerprint.touchSupport && fingerprint.platform.includes('Mobile')) {
      botScore += 15
      reasons.push('Platform/touch mismatch')
    }

    // Check 9: Very few fonts (headless)
    if (fingerprint.fonts.length < 3) {
      botScore += 10
      reasons.push('Very few fonts installed')
      threats.push('Minimal environment')
    }

    const isBot = botScore >= 50
    const confidence = Math.min(botScore, 100)

    return {
      isBot,
      confidence,
      reasons,
      fingerprint,
      threats
    }
  }

  /**
   * Store fingerprint for session binding
   */
  storeFingerprint(fingerprint: DeviceFingerprint): void {
    try {
      localStorage.setItem('device_fingerprint', JSON.stringify(fingerprint))
      sessionStorage.setItem('device_fingerprint_session', fingerprint.id)
    } catch (e) {
      console.error('Failed to store fingerprint:', e)
    }
  }

  /**
   * Get stored fingerprint
   */
  getStoredFingerprint(): DeviceFingerprint | null {
    try {
      const stored = localStorage.getItem('device_fingerprint')
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      return null
    }
  }

  /**
   * Compare fingerprints for session hijacking detection
   */
  async validateFingerprint(): Promise<{ valid: boolean; reason?: string }> {
    const stored = this.getStoredFingerprint()
    if (!stored) return { valid: true } // First time

    const current = await this.generateFingerprint()

    // Critical fields must match
    if (stored.canvas !== current.canvas) {
      return { valid: false, reason: 'Canvas fingerprint changed' }
    }

    if (stored.webgl !== current.webgl) {
      return { valid: false, reason: 'WebGL fingerprint changed' }
    }

    if (stored.timezone !== current.timezone) {
      return { valid: false, reason: 'Timezone changed' }
    }

    if (stored.screenResolution !== current.screenResolution) {
      return { valid: false, reason: 'Screen resolution changed' }
    }

    return { valid: true }
  }
}

// Singleton instance
let botDetectionInstance: BotDetectionService | null = null

export function getBotDetectionService(): BotDetectionService {
  if (typeof window === 'undefined') {
    throw new Error('BotDetectionService can only be used in browser')
  }
  
  if (!botDetectionInstance) {
    botDetectionInstance = new BotDetectionService()
  }
  
  return botDetectionInstance
}

export { BotDetectionService }
