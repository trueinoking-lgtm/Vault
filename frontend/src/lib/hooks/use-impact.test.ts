import { describe, expect, it } from 'vitest'
import { withFallback } from './use-impact'

describe('Impact query fallback contract', () => {
  it('preserves populated API data', async () => {
    const query = withFallback(
      async () => ({ schools: [{ id: 'api-school' }], total: 1 }),
      { schools: [{ id: 'seeded-school' }], total: 1 },
      (result) => result.schools.length === 0,
    )
    await expect(query()).resolves.toEqual({ schools: [{ id: 'api-school' }], total: 1 })
  })

  it('uses seeded evidence for a successful but empty API response', async () => {
    const fallback = { schools: [{ id: 'seeded-school' }], total: 1 }
    const query = withFallback(
      async () => ({ schools: [] as Array<{ id: string }>, total: 0 }),
      fallback,
      (result) => result.schools.length === 0,
    )
    await expect(query()).resolves.toEqual(fallback)
  })

  it('uses seeded evidence when the API is unavailable', async () => {
    const fallback = { assessments: [{ id: 'seeded-assessment' }], total: 1 }
    const query = withFallback(
      async () => { throw new Error('offline') },
      fallback,
    )
    await expect(query()).resolves.toEqual(fallback)
  })
})
