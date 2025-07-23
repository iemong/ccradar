import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { ClaudeInvoker, type Issue, IssueWatcher, Logger, loadConfig } from '@ccradar/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const testCacheDir = join(process.cwd(), 'tests', 'fixtures', 'cache')
const _testConfigDir = join(process.cwd(), 'tests', 'fixtures')

describe('ccradar Integration Tests', () => {
  const _mockIssue: Issue = {
    number: 123,
    title: 'Test Integration Issue',
    state: 'open',
    labels: ['bug', 'implement'],
    assignee: 'testuser',
    repo: 'owner/repo',
    url: 'https://github.com/owner/repo/issues/123',
    updatedAt: '2025-07-10T12:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Configuration Loading', () => {
    it('should load configuration with CLI options', () => {
      const config = loadConfig({
        triggerLabel: 'custom-label',
        claudePath: '/custom/claude',
        cacheDir: '/custom/cache',
      })

      expect(config.triggerLabel).toBe('custom-label')
      expect(config.claudePath).toBe('/custom/claude')
      expect(config.cacheDir).toBe('/custom/cache')
    })

    it('should use default values when options are not provided', () => {
      const config = loadConfig()

      expect(config.triggerLabel).toBe('implement')
      expect(config.claudePath).toBeUndefined()
      expect(config.cacheDir).toContain('.ccradar')
      expect(config.useSandbox).toBe(false)
      expect(config.sandboxConfigPath).toBeUndefined()
    })

    it('should load sandbox configuration from CLI options', () => {
      const config = loadConfig({
        useSandbox: true,
        sandboxConfig: '/custom/sandbox.sb',
      })

      expect(config.useSandbox).toBe(true)
      expect(config.sandboxConfigPath).toBe('/custom/sandbox.sb')
    })

    it('should handle sandbox configuration with false value', () => {
      const config = loadConfig({ useSandbox: false })

      expect(config.useSandbox).toBe(false)
    })
  })

  describe('Component Integration', () => {
    it('should create and use IssueWatcher with Logger', async () => {
      const mockConfig = loadConfig({
        triggerLabel: 'implement',
        cacheDir: testCacheDir,
      })

      const watcher = new IssueWatcher(mockConfig, process.cwd())
      const logger = new Logger(join(mockConfig.cacheDir, 'logs'))

      expect(watcher).toBeInstanceOf(IssueWatcher)
      expect(logger).toBeInstanceOf(Logger)

      // Test that logger can write info
      await expect(logger.info('Test message')).resolves.not.toThrow()
    })

    it('should create ClaudeInvoker with configuration', () => {
      const mockConfig = {
        claudePath: '/custom/claude',
      }

      const invoker = new ClaudeInvoker(mockConfig)
      expect(invoker).toBeInstanceOf(ClaudeInvoker)
    })

    it('should integrate ClaudeInvoker with Logger', async () => {
      const logger = new Logger(join(testCacheDir, 'logs'))
      const invoker = new ClaudeInvoker()

      await logger.info('Starting Claude invocation test')

      // Test that both components can coexist
      expect(logger).toBeInstanceOf(Logger)
      expect(invoker).toBeInstanceOf(ClaudeInvoker)
    })
  })

  describe('Cache Directory Management', () => {
    it('should create necessary directories', async () => {
      const logger = new Logger(join(testCacheDir, 'logs'))
      await logger.info('Test log entry')

      // Check if log directory was created
      const logDir = join(testCacheDir, 'logs')
      const logStat = await stat(logDir)
      expect(logStat.isDirectory()).toBe(true)
    })

    it('should handle cache directory structure', async () => {
      const config = loadConfig({
        triggerLabel: 'implement',
        cacheDir: testCacheDir,
      })

      const logger = new Logger(join(config.cacheDir, 'logs'))
      await logger.info('Cache structure test')

      // Check base cache directory
      const cacheStat = await stat(config.cacheDir)
      expect(cacheStat.isDirectory()).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle logger with valid path', async () => {
      const logger = new Logger(join(testCacheDir, 'test-logs'))

      // Logger should work with valid paths
      await expect(logger.info('Test message')).resolves.not.toThrow()
    })
  })

  describe('Workflow Integration', () => {
    it('should demonstrate complete workflow components', async () => {
      const config = loadConfig({
        triggerLabel: 'implement',
        cacheDir: testCacheDir,
      })

      const invoker = new ClaudeInvoker({
        claudePath: config.claudePath,
        workDir: config.workDir,
        useSandbox: config.useSandbox,
        sandboxConfigPath: config.sandboxConfigPath,
      })
      const logger = new Logger(join(config.cacheDir, 'logs'))

      // Log workflow start
      await logger.info('Workflow integration test started')

      // Verify all components are created
      expect(invoker).toBeInstanceOf(ClaudeInvoker)
      expect(logger).toBeInstanceOf(Logger)

      // Log workflow completion
      await logger.info('Workflow integration test completed')
    })
  })
})
