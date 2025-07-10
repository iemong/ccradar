import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.js'

describe('loadConfig', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should throw error when GITHUB_TOKEN is missing', () => {
    delete process.env.GITHUB_TOKEN
    expect(() => loadConfig()).toThrow('GITHUB_TOKEN environment variable is required')
  })

  it('should throw error when GITHUB_REPOS is missing', () => {
    process.env.GITHUB_TOKEN = 'test-token'
    delete process.env.GITHUB_REPOS
    expect(() => loadConfig()).toThrow('GITHUB_REPOS environment variable is required')
  })

  it('should load config with default values', () => {
    process.env.GITHUB_TOKEN = 'test-token'
    process.env.GITHUB_REPOS = 'owner1/repo1,owner2/repo2'

    const config = loadConfig()

    expect(config.githubToken).toBe('test-token')
    expect(config.repos).toEqual(['owner1/repo1', 'owner2/repo2'])
    expect(config.triggerLabel).toBe('implement')
    expect(config.cacheDir).toContain('.ccradar')
  })

  it('should use custom trigger label', () => {
    process.env.GITHUB_TOKEN = 'test-token'
    process.env.GITHUB_REPOS = 'owner/repo'
    process.env.TRIGGER_LABEL = 'auto-implement'

    const config = loadConfig()

    expect(config.triggerLabel).toBe('auto-implement')
  })

  it('should handle spaces in GITHUB_REPOS', () => {
    process.env.GITHUB_TOKEN = 'test-token'
    process.env.GITHUB_REPOS = 'owner1/repo1, owner2/repo2 , owner3/repo3'

    const config = loadConfig()

    expect(config.repos).toEqual(['owner1/repo1', 'owner2/repo2', 'owner3/repo3'])
  })
})
