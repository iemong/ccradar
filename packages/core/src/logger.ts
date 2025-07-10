import { existsSync } from 'node:fs'
import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

export interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
  data?: unknown
}

export class Logger {
  private logDir: string

  constructor(logDir: string) {
    this.logDir = logDir
  }

  private async ensureLogDir(): Promise<void> {
    if (!existsSync(this.logDir)) {
      await mkdir(this.logDir, { recursive: true })
    }
  }

  private getLogFile(): string {
    const date = new Date().toISOString().split('T')[0]
    return join(this.logDir, `${date}.log`)
  }

  async log(level: LogEntry['level'], message: string, data?: unknown): Promise<void> {
    await this.ensureLogDir()

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }

    const logLine = JSON.stringify(entry) + '\n'
    await appendFile(this.getLogFile(), logLine)
  }

  async info(message: string, data?: unknown): Promise<void> {
    await this.log('info', message, data)
  }

  async warn(message: string, data?: unknown): Promise<void> {
    await this.log('warn', message, data)
  }

  async error(message: string, data?: unknown): Promise<void> {
    await this.log('error', message, data)
  }
}
