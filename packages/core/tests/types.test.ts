import { describe, expect, it } from 'vitest'
import type { Config, Issue, IssueEvent } from '../src/types.js'

describe('Types', () => {
  describe('Config', () => {
    it('should define required properties', () => {
      const config: Config = {
        githubToken: 'test-token',
        repos: ['owner/repo1', 'owner/repo2'],
        triggerLabel: 'implement',
        cacheDir: '/tmp/cache',
      }

      expect(config.githubToken).toBe('test-token')
      expect(config.repos).toEqual(['owner/repo1', 'owner/repo2'])
      expect(config.triggerLabel).toBe('implement')
      expect(config.cacheDir).toBe('/tmp/cache')
    })

    it('should allow optional claudePath', () => {
      const config: Config = {
        githubToken: 'test-token',
        repos: ['owner/repo'],
        triggerLabel: 'implement',
        cacheDir: '/tmp/cache',
        claudePath: '/custom/claude',
      }

      expect(config.claudePath).toBe('/custom/claude')
    })

    it('should allow undefined claudePath', () => {
      const config: Config = {
        githubToken: 'test-token',
        repos: ['owner/repo'],
        triggerLabel: 'implement',
        cacheDir: '/tmp/cache',
      }

      expect(config.claudePath).toBeUndefined()
    })
  })

  describe('IssueEvent', () => {
    it('should define all required properties', () => {
      const event: IssueEvent = {
        id: 'event-123',
        issueNumber: 456,
        repo: 'owner/repo',
        action: 'labeled',
        label: 'implement',
        timestamp: '2025-07-10T12:00:00Z',
      }

      expect(event.id).toBe('event-123')
      expect(event.issueNumber).toBe(456)
      expect(event.repo).toBe('owner/repo')
      expect(event.action).toBe('labeled')
      expect(event.label).toBe('implement')
      expect(event.timestamp).toBe('2025-07-10T12:00:00Z')
    })
  })

  describe('Issue', () => {
    it('should define all required properties', () => {
      const issue: Issue = {
        number: 123,
        title: 'Test Issue',
        state: 'open',
        labels: ['bug', 'implement'],
        assignee: 'testuser',
        repo: 'owner/repo',
        url: 'https://github.com/owner/repo/issues/123',
        updatedAt: '2025-07-10T12:00:00Z',
      }

      expect(issue.number).toBe(123)
      expect(issue.title).toBe('Test Issue')
      expect(issue.state).toBe('open')
      expect(issue.labels).toEqual(['bug', 'implement'])
      expect(issue.assignee).toBe('testuser')
      expect(issue.repo).toBe('owner/repo')
      expect(issue.url).toBe('https://github.com/owner/repo/issues/123')
      expect(issue.updatedAt).toBe('2025-07-10T12:00:00Z')
    })

    it('should allow null assignee', () => {
      const issue: Issue = {
        number: 123,
        title: 'Unassigned Issue',
        state: 'open',
        labels: [],
        assignee: null,
        repo: 'owner/repo',
        url: 'https://github.com/owner/repo/issues/123',
        updatedAt: '2025-07-10T12:00:00Z',
      }

      expect(issue.assignee).toBeNull()
    })

    it('should allow empty labels array', () => {
      const issue: Issue = {
        number: 123,
        title: 'No Labels Issue',
        state: 'open',
        labels: [],
        assignee: 'testuser',
        repo: 'owner/repo',
        url: 'https://github.com/owner/repo/issues/123',
        updatedAt: '2025-07-10T12:00:00Z',
      }

      expect(issue.labels).toEqual([])
    })

    it('should handle various states', () => {
      const openIssue: Issue = {
        number: 1,
        title: 'Open Issue',
        state: 'open',
        labels: [],
        assignee: null,
        repo: 'owner/repo',
        url: 'https://github.com/owner/repo/issues/1',
        updatedAt: '2025-07-10T12:00:00Z',
      }

      const closedIssue: Issue = {
        number: 2,
        title: 'Closed Issue',
        state: 'closed',
        labels: [],
        assignee: null,
        repo: 'owner/repo',
        url: 'https://github.com/owner/repo/issues/2',
        updatedAt: '2025-07-10T12:00:00Z',
      }

      expect(openIssue.state).toBe('open')
      expect(closedIssue.state).toBe('closed')
    })
  })

  describe('Type compatibility', () => {
    it('should allow proper type assignments', () => {
      // Config型の互換性テスト
      const partialConfig: Partial<Config> = {
        githubToken: 'test',
      }

      const fullConfig: Config = {
        githubToken: 'test-token',
        repos: ['repo'],
        triggerLabel: 'label',
        cacheDir: '/cache',
        ...partialConfig,
      }

      expect(fullConfig.githubToken).toBe('test')
    })

    it('should enforce required properties', () => {
      // TypeScriptのコンパイル時チェックのため、実行時テストは限定的
      expect(() => {
        const config = {} as Config
        // 実際の使用時にはTypeScriptがエラーを出すが、
        // ランタイムでは undefined になる
        return config.githubToken || 'fallback'
      }).not.toThrow()
    })
  })
})
