import assert from 'node:assert/strict'
import test from 'node:test'
import { InMemoryRateLimiter } from '../frontend/lib/agent/rate-limiter'

test('Rate Limiter: enforces request quotas within time window', () => {
  const limiter = new InMemoryRateLimiter({
    maxRequests: 3,
    windowMs: 1000,
  })

  // First 3 requests should be allowed
  const r1 = limiter.check('client-1')
  assert.equal(r1.allowed, true)
  assert.equal(r1.remaining, 2)

  const r2 = limiter.check('client-1')
  assert.equal(r2.allowed, true)
  assert.equal(r2.remaining, 1)

  const r3 = limiter.check('client-1')
  assert.equal(r3.allowed, true)
  assert.equal(r3.remaining, 0)

  // 4th request must be denied
  const r4 = limiter.check('client-1')
  assert.equal(r4.allowed, false)
  assert.equal(r4.remaining, 0)
  assert.ok(r4.resetMs > 0)

  limiter.destroy()
})

test('Rate Limiter: isolates quota per client identifier', () => {
  const limiter = new InMemoryRateLimiter({
    maxRequests: 2,
    windowMs: 5000,
  })

  limiter.check('user-A')
  limiter.check('user-A')
  assert.equal(limiter.check('user-A').allowed, false)

  // user-B should still have their full quota
  const b1 = limiter.check('user-B')
  assert.equal(b1.allowed, true)
  assert.equal(b1.remaining, 1)

  limiter.destroy()
})

test('Rate Limiter: resets correctly when requested', () => {
  const limiter = new InMemoryRateLimiter({ maxRequests: 1, windowMs: 10000 })
  limiter.check('ip-1')
  assert.equal(limiter.check('ip-1').allowed, false)

  limiter.reset('ip-1')
  assert.equal(limiter.check('ip-1').allowed, true)

  limiter.destroy()
})
