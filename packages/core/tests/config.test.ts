import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadConfig } from '../src/config.js'

describe('Config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('loadConfig', () => {
    it('should load basic configuration', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = 'owner/repo1,owner/repo2'

      const config = loadConfig()

      expect(config.githubToken).toBe('test-token')
      expect(config.repos).toEqual(['owner/repo1', 'owner/repo2'])
      expect(config.triggerLabel).toBe('implement')
    })

    it('should use custom trigger label', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = 'owner/repo'
      process.env.TRIGGER_LABEL = 'auto-implement'

      const config = loadConfig()

      expect(config.triggerLabel).toBe('auto-implement')
    })

    it('should use custom cache directory', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = 'owner/repo'
      process.env.CCRADAR_CACHE_DIR = '/custom/cache/dir'

      const config = loadConfig()

      expect(config.cacheDir).toBe('/custom/cache/dir')
    })

    it('should use custom Claude path', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = 'owner/repo'
      process.env.CLAUDE_PATH = '/custom/claude/path'

      const config = loadConfig()

      expect(config.claudePath).toBe('/custom/claude/path')
    })

    it('should use custom working directory', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = 'owner/repo'
      process.env.CCRADAR_WORK_DIR = '/custom/work/dir'

      const config = loadConfig()

      expect(config.workDir).toBe('/custom/work/dir')
    })

    it('should return undefined for workDir if not set', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = 'owner/repo'
      delete process.env.CCRADAR_WORK_DIR

      const config = loadConfig()

      expect(config.workDir).toBeUndefined()
    })

    it('should throw error if GITHUB_TOKEN is missing', () => {
      delete process.env.GITHUB_TOKEN
      process.env.GITHUB_REPOS = 'owner/repo'

      expect(() => loadConfig()).toThrow('GITHUB_TOKEN environment variable is required')
    })

    it('should throw error if GITHUB_REPOS is missing', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      delete process.env.GITHUB_REPOS

      expect(() => loadConfig()).toThrow('GITHUB_REPOS environment variable is required')
    })

    it('should throw error if GITHUB_REPOS is empty', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = '  ,  ,  '

      expect(() => loadConfig()).toThrow(
        'At least one repository must be specified in GITHUB_REPOS',
      )
    })

    it('should trim and filter repository names', () => {
      process.env.GITHUB_TOKEN = 'test-token'
      process.env.GITHUB_REPOS = ' owner/repo1 , , owner/repo2 , '

      const config = loadConfig()

      expect(config.repos).toEqual(['owner/repo1', 'owner/repo2'])
    })
  })
})
