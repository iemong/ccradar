import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IssueWatcher } from '../src/listAssigned.js'
import type { Config, Issue } from '../src/types.js'

// 依存関係をモック
const mockGitHubClient = {
  initialize: vi.fn(),
  getCurrentUser: vi.fn(),
  getAssignedIssues: vi.fn(),
  getIssueEvents: vi.fn(),
}

const mockCacheService = {
  isEventProcessed: vi.fn(),
  addProcessedEvent: vi.fn(),
  generateEventId: vi.fn(),
}

vi.mock('../src/githubClient.js', () => ({
  GitHubClient: vi.fn(() => mockGitHubClient),
}))

vi.mock('../src/cacheService.js', () => ({
  CacheService: vi.fn(() => mockCacheService),
}))

describe('IssueWatcher', () => {
  let watcher: IssueWatcher
  const config: Config = {
    triggerLabel: 'implement',
    cacheDir: '/tmp/test',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    watcher = new IssueWatcher(config, '/test/repo')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(watcher).toBeInstanceOf(IssueWatcher)
    })
  })

  describe('initialize', () => {
    it('should call GitHubClient.initialize', async () => {
      await watcher.initialize()

      expect(mockGitHubClient.initialize).toHaveBeenCalled()
    })
  })

  describe('checkForNewLabeledIssues', () => {
    const mockIssue: Issue = {
      number: 123,
      title: 'Test Issue',
      state: 'open',
      labels: ['implement'],
      assignee: 'testuser',
      repo: 'owner/repo',
      url: 'https://github.com/owner/repo/issues/123',
      updatedAt: '2025-07-10T12:00:00Z',
    }

    it('should return new labeled issues', async () => {
      mockGitHubClient.getAssignedIssues.mockResolvedValue([mockIssue])
      mockGitHubClient.getIssueEvents.mockResolvedValue([
        {
          id: 1,
          event: 'labeled',
          created_at: '2025-07-10T12:00:00Z',
          label: { name: 'implement' },
        },
      ])
      mockCacheService.isEventProcessed.mockResolvedValue(false)
      mockCacheService.generateEventId.mockReturnValue('event-id-1')

      const result = await watcher.checkForNewLabeledIssues()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockIssue)
      expect(mockCacheService.addProcessedEvent).toHaveBeenCalledWith('event-id-1')
    })

    it('should skip issues without trigger label', async () => {
      const issueWithoutLabel = { ...mockIssue, labels: ['bug'] }

      mockGitHubClient.getAssignedIssues.mockResolvedValue([issueWithoutLabel])

      const result = await watcher.checkForNewLabeledIssues()

      expect(result).toHaveLength(0)
      expect(mockGitHubClient.getIssueEvents).not.toHaveBeenCalled()
    })

    it('should skip already processed events', async () => {
      mockGitHubClient.getAssignedIssues.mockResolvedValue([mockIssue])
      mockGitHubClient.getIssueEvents.mockResolvedValue([
        {
          id: 1,
          event: 'labeled',
          created_at: '2025-07-10T12:00:00Z',
          label: { name: 'implement' },
        },
      ])
      mockCacheService.isEventProcessed.mockResolvedValue(true)
      mockCacheService.generateEventId.mockReturnValue('event-id-1')

      const result = await watcher.checkForNewLabeledIssues()

      expect(result).toHaveLength(0)
      expect(mockCacheService.addProcessedEvent).not.toHaveBeenCalled()
    })

    it('should handle invalid repo format', async () => {
      const invalidIssue = { ...mockIssue, repo: 'invalid-repo' }

      mockGitHubClient.getAssignedIssues.mockResolvedValue([invalidIssue])

      const result = await watcher.checkForNewLabeledIssues()

      expect(result).toHaveLength(0)
      expect(mockGitHubClient.getIssueEvents).not.toHaveBeenCalled()
    })

    it('should handle events without label property', async () => {
      mockGitHubClient.getAssignedIssues.mockResolvedValue([mockIssue])
      mockGitHubClient.getIssueEvents.mockResolvedValue([
        {
          id: 1,
          event: 'assigned',
          created_at: '2025-07-10T12:00:00Z',
        },
      ])

      const result = await watcher.checkForNewLabeledIssues()

      expect(result).toHaveLength(0)
    })

    it('should handle events with different label names', async () => {
      mockGitHubClient.getAssignedIssues.mockResolvedValue([mockIssue])
      mockGitHubClient.getIssueEvents.mockResolvedValue([
        {
          id: 1,
          event: 'labeled',
          created_at: '2025-07-10T12:00:00Z',
          label: { name: 'bug' },
        },
      ])

      const result = await watcher.checkForNewLabeledIssues()

      expect(result).toHaveLength(0)
    })

    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockGitHubClient.getAssignedIssues.mockResolvedValue([mockIssue])
      mockGitHubClient.getIssueEvents.mockRejectedValue(new Error('API Error'))

      const result = await watcher.checkForNewLabeledIssues()

      expect(result).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to check events for owner/repo#123:',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })

    it('should stop processing after finding first unprocessed event', async () => {
      mockGitHubClient.getAssignedIssues.mockResolvedValue([mockIssue])
      mockGitHubClient.getIssueEvents.mockResolvedValue([
        {
          id: 1,
          event: 'labeled',
          created_at: '2025-07-10T12:00:00Z',
          label: { name: 'implement' },
        },
        {
          id: 2,
          event: 'labeled',
          created_at: '2025-07-10T13:00:00Z',
          label: { name: 'implement' },
        },
      ])
      mockCacheService.isEventProcessed.mockResolvedValue(false)
      mockCacheService.generateEventId.mockReturnValue('event-id-1')

      const result = await watcher.checkForNewLabeledIssues()

      expect(result).toHaveLength(1)
      expect(mockCacheService.addProcessedEvent).toHaveBeenCalledTimes(1)
    })
  })

  describe('getAllAssignedIssues', () => {
    it('should return all assigned issues', async () => {
      const mockIssues: Issue[] = [
        {
          number: 123,
          title: 'Test Issue',
          state: 'open',
          labels: ['implement'],
          assignee: 'testuser',
          repo: 'owner/repo',
          url: 'https://github.com/owner/repo/issues/123',
          updatedAt: '2025-07-10T12:00:00Z',
        },
      ]

      mockGitHubClient.getAssignedIssues.mockResolvedValue(mockIssues)

      const result = await watcher.getAllAssignedIssues()

      expect(result).toEqual(mockIssues)
      expect(mockGitHubClient.getAssignedIssues).toHaveBeenCalledTimes(1)
    })
  })
})
