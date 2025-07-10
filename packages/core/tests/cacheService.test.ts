import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CacheService } from '../src/cacheService.js'

describe('CacheService', () => {
  let tempDir: string
  let cacheService: CacheService

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ccradar-test-'))
    cacheService = new CacheService(tempDir)
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('should return empty set for new cache', async () => {
    const events = await cacheService.getProcessedEvents()
    expect(events.size).toBe(0)
  })

  it('should save and retrieve processed events', async () => {
    const eventId = 'test-event-1'
    await cacheService.addProcessedEvent(eventId)

    const events = await cacheService.getProcessedEvents()
    expect(events.has(eventId)).toBe(true)
    expect(events.size).toBe(1)
  })

  it('should check if event is processed', async () => {
    const eventId = 'test-event-2'

    expect(await cacheService.isEventProcessed(eventId)).toBe(false)

    await cacheService.addProcessedEvent(eventId)

    expect(await cacheService.isEventProcessed(eventId)).toBe(true)
  })

  it('should generate consistent event IDs', () => {
    const event = {
      id: '123',
      issueNumber: 42,
      repo: 'owner/repo',
      action: 'labeled',
      label: 'implement',
      timestamp: '2025-07-10T12:00:00Z',
    }

    const id1 = cacheService.generateEventId(event)
    const id2 = cacheService.generateEventId(event)

    expect(id1).toBe(id2)
    expect(id1).toContain('owner/repo')
    expect(id1).toContain('42')
    expect(id1).toContain('labeled')
    expect(id1).toContain('implement')
  })
})
