import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { IssueEvent } from './types.js'

export class CacheService {
  private cacheFile: string

  constructor(cacheDir: string) {
    this.cacheFile = join(cacheDir, 'processed-events.json')
  }

  async ensureCacheDir(): Promise<void> {
    const dir = dirname(this.cacheFile)
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }

  async getProcessedEvents(): Promise<Set<string>> {
    await this.ensureCacheDir()

    if (!existsSync(this.cacheFile)) {
      return new Set()
    }

    try {
      const content = await readFile(this.cacheFile, 'utf-8')
      const data = JSON.parse(content) as { events: string[] }
      return new Set(data.events || [])
    } catch (error) {
      console.error('Failed to read cache file:', error)
      return new Set()
    }
  }

  async saveProcessedEvents(events: Set<string>): Promise<void> {
    await this.ensureCacheDir()

    const data = {
      events: Array.from(events),
      lastUpdated: new Date().toISOString(),
    }

    await writeFile(this.cacheFile, JSON.stringify(data, null, 2))
  }

  async addProcessedEvent(eventId: string): Promise<void> {
    const events = await this.getProcessedEvents()
    events.add(eventId)
    await this.saveProcessedEvents(events)
  }

  async isEventProcessed(eventId: string): Promise<boolean> {
    const events = await this.getProcessedEvents()
    return events.has(eventId)
  }

  generateEventId(event: IssueEvent): string {
    return `${event.repo}#${event.issueNumber}:${event.action}:${event.label}:${event.timestamp}`
  }
}
