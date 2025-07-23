import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GitHubClient } from '../src/githubClient.js'
import type { Config } from '../src/types.js'

// execSyncをモック
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}))

// repoUtilsをモック
vi.mock('../src/repoUtils.js', () => ({
  getCurrentRepoInfo: vi.fn(),
  checkGitHubCLI: vi.fn(),
  checkGitHubAuth: vi.fn(),
}))

describe('GitHubClient', () => {
  let client: GitHubClient
  const config: Config = {
    triggerLabel: 'implement',
    cacheDir: '/tmp/test',
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    // GitHub CLI関連のモックをセットアップ
    const { checkGitHubCLI, checkGitHubAuth } = await import('../src/repoUtils.js')
    vi.mocked(checkGitHubCLI).mockResolvedValue(true)
    vi.mocked(checkGitHubAuth).mockResolvedValue(true)

    client = new GitHubClient(config, '/test/repo')
  })

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(client).toBeInstanceOf(GitHubClient)
    })
  })

  describe('initialize', () => {
    it('should check GitHub CLI and auth', async () => {
      const { checkGitHubCLI, checkGitHubAuth } = await import('../src/repoUtils.js')

      await client.initialize()

      expect(checkGitHubCLI).toHaveBeenCalled()
      expect(checkGitHubAuth).toHaveBeenCalled()
    })

    it('should throw error if GitHub CLI is not installed', async () => {
      const { checkGitHubCLI } = await import('../src/repoUtils.js')
      vi.mocked(checkGitHubCLI).mockResolvedValue(false)

      await expect(client.initialize()).rejects.toThrow('GitHub CLI (gh) is not installed')
    })

    it('should throw error if GitHub CLI is not authenticated', async () => {
      const { checkGitHubAuth } = await import('../src/repoUtils.js')
      vi.mocked(checkGitHubAuth).mockResolvedValue(false)

      await expect(client.initialize()).rejects.toThrow('GitHub CLI is not authenticated')
    })
  })

  describe('getAssignedIssues', () => {
    it('should return issues from current repository', async () => {
      const { getCurrentRepoInfo } = await import('../src/repoUtils.js')
      const { execSync } = await import('node:child_process')

      vi.mocked(getCurrentRepoInfo).mockResolvedValue({
        owner: 'testowner',
        name: 'testrepo',
        fullName: 'testowner/testrepo',
      })

      const mockGhOutput = JSON.stringify([
        {
          number: 1,
          title: 'Test Issue',
          labels: [{ name: 'bug' }, { name: 'implement' }],
          url: 'https://github.com/testowner/testrepo/issues/1',
          updatedAt: '2025-07-10T12:00:00Z',
        },
      ])

      vi.mocked(execSync).mockReturnValue(mockGhOutput)

      const result = await client.getAssignedIssues()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        number: 1,
        title: 'Test Issue',
        labels: ['bug', 'implement'],
        repo: 'testowner/testrepo',
        state: 'open',
      })
      expect(execSync).toHaveBeenCalledWith(
        'gh issue list --assignee @me --state open --json number,title,labels,url,updatedAt',
        expect.objectContaining({
          cwd: '/test/repo',
          encoding: 'utf8',
          stdio: 'pipe',
        }),
      )
    })

    it('should throw error if not in a GitHub repository', async () => {
      const { getCurrentRepoInfo } = await import('../src/repoUtils.js')
      vi.mocked(getCurrentRepoInfo).mockResolvedValue(null)

      await expect(client.getAssignedIssues()).rejects.toThrow('Not in a GitHub repository')
    })

    it('should handle GitHub CLI errors gracefully', async () => {
      const { getCurrentRepoInfo } = await import('../src/repoUtils.js')
      const { execSync } = await import('node:child_process')

      vi.mocked(getCurrentRepoInfo).mockResolvedValue({
        owner: 'testowner',
        name: 'testrepo',
        fullName: 'testowner/testrepo',
      })

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('gh command failed')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await client.getAssignedIssues()

      expect(result).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch issues for testowner/testrepo:',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user login', async () => {
      const { execSync } = await import('node:child_process')

      vi.mocked(execSync).mockReturnValue('testuser\n')

      const result = await client.getCurrentUser()

      expect(result).toBe('testuser')
      expect(execSync).toHaveBeenCalledWith('gh api user --jq .login', {
        encoding: 'utf8',
        stdio: 'pipe',
      })
    })

    it('should handle GitHub CLI errors', async () => {
      const { execSync } = await import('node:child_process')

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('gh auth failed')
      })

      await expect(client.getCurrentUser()).rejects.toThrow(
        'Failed to get current user from GitHub CLI',
      )
    })
  })

  describe('getIssueEvents', () => {
    it('should return issue events', async () => {
      const { execSync } = await import('node:child_process')

      const mockEvents = [
        {
          id: 1,
          event: 'labeled',
          created_at: '2025-07-10T12:00:00Z',
          label: { name: 'implement' },
        },
      ]

      vi.mocked(execSync).mockReturnValue(JSON.stringify(mockEvents))

      const result = await client.getIssueEvents('owner', 'repo', 123)

      expect(result).toEqual(mockEvents)
      expect(execSync).toHaveBeenCalledWith('gh api repos/owner/repo/issues/123/events', {
        encoding: 'utf8',
        stdio: 'pipe',
      })
    })

    it('should handle GitHub CLI errors gracefully', async () => {
      const { execSync } = await import('node:child_process')

      vi.mocked(execSync).mockImplementation(() => {
        throw new Error('gh api failed')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const result = await client.getIssueEvents('owner', 'repo', 123)

      expect(result).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch events for issue #123:',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })
  })
})
