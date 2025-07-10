import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GitHubClient } from '../src/githubClient.js'
import type { Config } from '../src/types.js'

// Octokitをモック
const mockOctokit = {
  issues: {
    listForRepo: vi.fn(),
    listEvents: vi.fn(),
  },
  users: {
    getAuthenticated: vi.fn(),
  },
}

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(() => mockOctokit),
}))

describe('GitHubClient', () => {
  let client: GitHubClient
  const config: Config = {
    githubToken: 'test-token',
    repos: ['owner/repo1', 'owner/repo2'],
    triggerLabel: 'implement',
    cacheDir: '/tmp/test',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    client = new GitHubClient(config)
  })

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(client).toBeInstanceOf(GitHubClient)
    })
  })

  describe('getAssignedIssues', () => {
    it('should return issues for all repositories', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Test Issue',
          state: 'open',
          labels: [{ name: 'bug' }],
          assignee: { login: 'testuser' },
          html_url: 'https://github.com/owner/repo1/issues/1',
          updated_at: '2025-07-10T12:00:00Z',
        },
      ]

      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues })

      const result = await client.getAssignedIssues('testuser')

      expect(result).toHaveLength(2) // 2 repos
      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledTimes(2)
      expect(mockOctokit.issues.listForRepo).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo1',
        assignee: 'testuser',
        state: 'open',
        per_page: 100,
      })
    })

    it('should handle labels as strings or objects', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Test Issue',
          state: 'open',
          labels: ['string-label', { name: 'object-label' }, { name: null }],
          assignee: { login: 'testuser' },
          html_url: 'https://github.com/owner/repo1/issues/1',
          updated_at: '2025-07-10T12:00:00Z',
        },
      ]

      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues })

      const result = await client.getAssignedIssues('testuser')

      expect(result[0].labels).toEqual(['string-label', 'object-label', ''])
    })

    it('should handle assignee as null', async () => {
      const mockIssues = [
        {
          number: 1,
          title: 'Test Issue',
          state: 'open',
          labels: [],
          assignee: null,
          html_url: 'https://github.com/owner/repo1/issues/1',
          updated_at: '2025-07-10T12:00:00Z',
        },
      ]

      mockOctokit.issues.listForRepo.mockResolvedValue({ data: mockIssues })

      const result = await client.getAssignedIssues('testuser')

      expect(result[0].assignee).toBeNull()
    })

    it('should handle invalid repo format', async () => {
      const invalidConfig = { ...config, repos: ['invalid-repo'] }
      const invalidClient = new GitHubClient(invalidConfig)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await invalidClient.getAssignedIssues('testuser')

      expect(result).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledWith('Invalid repo format: invalid-repo')

      consoleSpy.mockRestore()
    })

    it('should handle API errors gracefully', async () => {
      mockOctokit.issues.listForRepo.mockRejectedValue(new Error('API Error'))

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await client.getAssignedIssues('testuser')

      expect(result).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch issues for owner/repo1:',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user login', async () => {
      mockOctokit.users.getAuthenticated.mockResolvedValue({
        data: { login: 'testuser' },
      })

      const result = await client.getCurrentUser()

      expect(result).toBe('testuser')
      expect(mockOctokit.users.getAuthenticated).toHaveBeenCalledTimes(1)
    })
  })

  describe('getIssueEvents', () => {
    it('should return issue events', async () => {
      const mockEvents = [
        {
          id: 1,
          event: 'labeled',
          created_at: '2025-07-10T12:00:00Z',
          label: { name: 'implement' },
        },
      ]

      mockOctokit.issues.listEvents.mockResolvedValue({ data: mockEvents })

      const result = await client.getIssueEvents('owner', 'repo', 123)

      expect(result).toEqual(mockEvents)
      expect(mockOctokit.issues.listEvents).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: 123,
        per_page: 100,
      })
    })
  })
})
