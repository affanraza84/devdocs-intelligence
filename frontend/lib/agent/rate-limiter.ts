import type { RateLimitResult } from './types'

export interface RateLimiterOptions {
  maxRequests?: number
  windowMs?: number
}

interface RequestRecord {
  timestamps: number[]
}

export class InMemoryRateLimiter {
  private readonly records = new Map<string, RequestRecord>()
  private readonly maxRequests: number
  private readonly windowMs: number
  private cleanupTimer?: NodeJS.Timeout

  constructor(options: RateLimiterOptions = {}) {
    this.maxRequests =
      options.maxRequests ||
      (process.env.RATE_LIMIT_MAX_REQUESTS
        ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
        : 30)
    this.windowMs =
      options.windowMs ||
      (process.env.RATE_LIMIT_WINDOW_MS
        ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
        : 60_000)

    // Periodic sweep for old keys every 2 minutes (if in persistent environment)
    if (typeof setInterval !== 'undefined') {
      this.cleanupTimer = setInterval(() => this.prune(), 2 * 60_000)
      if (this.cleanupTimer.unref) {
        this.cleanupTimer.unref()
      }
    }
  }

  public check(identifier = 'anonymous'): RateLimitResult {
    const now = Date.now()
    const windowStart = now - this.windowMs

    let record = this.records.get(identifier)
    if (!record) {
      record = { timestamps: [] }
      this.records.set(identifier, record)
    }

    // Filter out timestamps outside current sliding window
    record.timestamps = record.timestamps.filter((t) => t > windowStart)

    const currentCount = record.timestamps.length

    if (currentCount >= this.maxRequests) {
      const oldestInWindow = record.timestamps[0] || now
      const resetMs = Math.max(0, oldestInWindow + this.windowMs - now)
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetMs,
      }
    }

    // Record this request
    record.timestamps.push(now)
    const remaining = Math.max(0, this.maxRequests - record.timestamps.length)

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining,
      resetMs: this.windowMs,
    }
  }

  public reset(identifier?: string): void {
    if (identifier) {
      this.records.delete(identifier)
    } else {
      this.records.clear()
    }
  }

  public prune(): void {
    const now = Date.now()
    const windowStart = now - this.windowMs

    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((t) => t > windowStart)
      if (record.timestamps.length === 0) {
        this.records.delete(key)
      }
    }
  }

  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }
    this.records.clear()
  }
}

// Global default singleton instance
export const globalRateLimiter = new InMemoryRateLimiter()
