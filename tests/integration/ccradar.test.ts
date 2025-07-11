import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { ClaudeInvoker, type Issue, IssueWatcher, Logger } from '@ccradar/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock dotenv to prevent .env file from being loaded
vi.mock('dotenv', () => ({
  config: vi.fn(),
}))

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
    // Clear environment variables
    delete process.env.GITHUB_TOKEN
    delete process.env.GITHUB_REPOS
    delete process.env.TRIGGER_LABEL
    delete process.env.CLAUDE_PATH
    delete process.env.CCRADAR_CACHE_DIR
  })

  describe('Configuration Loading', () => {
    it('should load configuration from environment variables', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = 'owner/repo1,owner/repo2'
      process.env.TRIGGER_LABEL = 'custom-label'
      process.env.CLAUDE_PATH = '/custom/claude'
      process.env.CCRADAR_CACHE_DIR = '/custom/cache'

      const config = loadConfig()

      expect(config.githubToken).toBe('test-token')
      expect(config.repos).toEqual(['owner/repo1', 'owner/repo2'])
      expect(config.triggerLabel).toBe('custom-label')
      expect(config.claudePath).toBe('/custom/claude')
      expect(config.cacheDir).toBe('/custom/cache')
    })

    it('should use default values when optional environment variables are not set', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = 'owner/repo'
      delete process.env.TRIGGER_LABEL
      delete process.env.CLAUDE_PATH
      delete process.env.CCRADAR_CACHE_DIR

      const config = loadConfig()

      expect(config.githubToken).toBe('test-token')
      expect(config.repos).toEqual(['owner/repo'])
      expect(config.triggerLabel).toBe('implement')
      expect(config.claudePath).toBeUndefined()
      expect(config.cacheDir).toBe(join(process.env.HOME || process.cwd(), '.ccradar'))
    })
  })

  describe('Component Integration', () => {
    it('should create and use IssueWatcher with Logger', async () => {
      const mockConfig = {
        githubToken: 'test-token',
        repos: ['owner/repo'],
        triggerLabel: 'implement',
        cacheDir: testCacheDir,
      }

      const watcher = new IssueWatcher(mockConfig)
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
      const config = {
        githubToken: 'test-token',
        repos: ['owner/repo'],
        triggerLabel: 'implement',
        cacheDir: testCacheDir,
      }

      const logger = new Logger(join(config.cacheDir, 'logs'))
      await logger.info('Cache structure test')

      // Check base cache directory
      const cacheStat = await stat(config.cacheDir)
      expect(cacheStat.isDirectory()).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle missing GITHUB_TOKEN', () => {
      delete process.env.GITHUB_TOKEN
      process.env.GITHUB_REPOS = 'owner/repo'

      expect(() => loadConfig()).toThrow('GITHUB_TOKEN environment variable is required')
    })

    it('should handle missing GITHUB_REPOS', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      delete process.env.GITHUB_REPOS

      expect(() => loadConfig()).toThrow('GITHUB_REPOS environment variable is required')
    })

    it('should handle logger with valid path', async () => {
      const logger = new Logger(join(testCacheDir, 'test-logs'))

      // Logger should work with valid paths
      await expect(logger.info('Test message')).resolves.not.toThrow()
    })
  })

  describe('Workflow Integration', () => {
    it('should demonstrate complete workflow components', async () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = 'owner/repo'

      const config = loadConfig()
      const watcher = new IssueWatcher(config)
      const invoker = new ClaudeInvoker({ claudePath: config.claudePath, workDir: config.workDir })
      const logger = new Logger(join(config.cacheDir, 'logs'))

      // Log workflow start
      await logger.info('Workflow integration test started')

      // Verify all components are created
      expect(watcher).toBeInstanceOf(IssueWatcher)
      expect(invoker).toBeInstanceOf(ClaudeInvoker)
      expect(logger).toBeInstanceOf(Logger)

      // Log workflow completion
      await logger.info('Workflow integration test completed')
    })
  })
})
