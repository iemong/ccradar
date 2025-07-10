import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LogEntry } from '../src/logger.js'
import { Logger } from '../src/logger.js'

describe('Logger', () => {
  let logger: Logger
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ccradar-logger-test-'))
    logger = new Logger(tempDir)
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('constructor', () => {
    it('should initialize with log directory', () => {
      expect(logger).toBeInstanceOf(Logger)
    })
  })

  describe('ensureLogDir', () => {
    it('should create log directory if it does not exist', async () => {
      const nonExistentDir = join(tempDir, 'new-logs')
      const newLogger = new Logger(nonExistentDir)

      await newLogger.info('test message')

      // ディレクトリが作成されることを確認
      const logFile = join(nonExistentDir, `${new Date().toISOString().split('T')[0]}.log`)
      const content = await readFile(logFile, 'utf-8')
      expect(content).toContain('test message')
    })
  })

  describe('getLogFile', () => {
    it('should generate correct log file path with current date', async () => {
      const mockDate = new Date('2025-07-10T12:00:00Z')
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)

      await logger.info('test message')

      const expectedLogFile = join(tempDir, '2025-07-10.log')
      const content = await readFile(expectedLogFile, 'utf-8')
      expect(content).toContain('test message')

      vi.useRealTimers()
    })
  })

  describe('log', () => {
    it('should write log entry to file', async () => {
      const mockDate = new Date('2025-07-10T12:00:00Z')
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)

      await logger.log('info', 'test message', { key: 'value' })

      const logFile = join(tempDir, '2025-07-10.log')
      const content = await readFile(logFile, 'utf-8')

      const logEntry = JSON.parse(content.trim()) as LogEntry
      expect(logEntry).toEqual({
        timestamp: '2025-07-10T12:00:00.000Z',
        level: 'info',
        message: 'test message',
        data: { key: 'value' },
      })

      vi.useRealTimers()
    })

    it('should append multiple log entries', async () => {
      await logger.log('info', 'first message')
      await logger.log('warn', 'second message')

      const logFile = join(tempDir, `${new Date().toISOString().split('T')[0]}.log`)
      const content = await readFile(logFile, 'utf-8')
      const lines = content.trim().split('\n')

      expect(lines).toHaveLength(2)

      const firstEntry = JSON.parse(lines[0]) as LogEntry
      const secondEntry = JSON.parse(lines[1]) as LogEntry

      expect(firstEntry.message).toBe('first message')
      expect(firstEntry.level).toBe('info')
      expect(secondEntry.message).toBe('second message')
      expect(secondEntry.level).toBe('warn')
    })

    it('should handle log entries without data', async () => {
      await logger.log('error', 'error message')

      const logFile = join(tempDir, `${new Date().toISOString().split('T')[0]}.log`)
      const content = await readFile(logFile, 'utf-8')

      const logEntry = JSON.parse(content.trim()) as LogEntry
      expect(logEntry.data).toBeUndefined()
    })
  })

  describe('info', () => {
    it('should log info level message', async () => {
      await logger.info('info message', { test: true })

      const logFile = join(tempDir, `${new Date().toISOString().split('T')[0]}.log`)
      const content = await readFile(logFile, 'utf-8')

      const logEntry = JSON.parse(content.trim()) as LogEntry
      expect(logEntry.level).toBe('info')
      expect(logEntry.message).toBe('info message')
      expect(logEntry.data).toEqual({ test: true })
    })
  })

  describe('warn', () => {
    it('should log warn level message', async () => {
      await logger.warn('warning message', { warning: true })

      const logFile = join(tempDir, `${new Date().toISOString().split('T')[0]}.log`)
      const content = await readFile(logFile, 'utf-8')

      const logEntry = JSON.parse(content.trim()) as LogEntry
      expect(logEntry.level).toBe('warn')
      expect(logEntry.message).toBe('warning message')
      expect(logEntry.data).toEqual({ warning: true })
    })
  })

  describe('error', () => {
    it('should log error level message', async () => {
      await logger.error('error message', { error: true })

      const logFile = join(tempDir, `${new Date().toISOString().split('T')[0]}.log`)
      const content = await readFile(logFile, 'utf-8')

      const logEntry = JSON.parse(content.trim()) as LogEntry
      expect(logEntry.level).toBe('error')
      expect(logEntry.message).toBe('error message')
      expect(logEntry.data).toEqual({ error: true })
    })
  })

  describe('complex data logging', () => {
    it('should handle complex data structures', async () => {
      const complexData = {
        array: [1, 2, 3],
        nested: {
          key: 'value',
          number: 42,
        },
        nullValue: null,
        boolValue: true,
      }

      await logger.info('complex data', complexData)

      const logFile = join(tempDir, `${new Date().toISOString().split('T')[0]}.log`)
      const content = await readFile(logFile, 'utf-8')

      const logEntry = JSON.parse(content.trim()) as LogEntry
      expect(logEntry.data).toEqual(complexData)
    })

    it('should handle circular references gracefully', async () => {
      const circularObj: any = { name: 'test' }
      circularObj.self = circularObj

      // JSON.stringifyは循環参照でエラーになるが、実際のケースではこれを避ける必要がある
      await expect(logger.info('circular data', circularObj)).rejects.toThrow()
    })
  })

  describe('concurrent logging', () => {
    it('should handle concurrent log writes', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        logger.info(`message ${i}`, { index: i }),
      )

      await Promise.all(promises)

      const logFile = join(tempDir, `${new Date().toISOString().split('T')[0]}.log`)
      const content = await readFile(logFile, 'utf-8')
      const lines = content.trim().split('\n')

      expect(lines).toHaveLength(10)

      // すべてのメッセージが書き込まれていることを確認
      const messages = lines.map((line) => JSON.parse(line).message)
      for (let i = 0; i < 10; i++) {
        expect(messages).toContain(`message ${i}`)
      }
    })
  })
})
