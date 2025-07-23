import { describe, expect, it } from 'vitest'
import * as coreIndex from '../src/index.js'

describe('Core Index Exports', () => {
  it('should export all types', () => {
    // 型のエクスポートは実行時に確認できないため、
    // 実際に使用可能かをテスト
    expect(typeof coreIndex).toBe('object')
  })

  it('should export GitHubClient class', () => {
    expect(coreIndex.GitHubClient).toBeDefined()
    expect(typeof coreIndex.GitHubClient).toBe('function')
  })

  it('should export CacheService class', () => {
    expect(coreIndex.CacheService).toBeDefined()
    expect(typeof coreIndex.CacheService).toBe('function')
  })

  it('should export ClaudeInvoker class', () => {
    expect(coreIndex.ClaudeInvoker).toBeDefined()
    expect(typeof coreIndex.ClaudeInvoker).toBe('function')
  })

  it('should export IssueWatcher class', () => {
    expect(coreIndex.IssueWatcher).toBeDefined()
    expect(typeof coreIndex.IssueWatcher).toBe('function')
  })

  it('should export Logger class', () => {
    expect(coreIndex.Logger).toBeDefined()
    expect(typeof coreIndex.Logger).toBe('function')
  })

  it('should export loadConfig function', () => {
    expect(coreIndex.loadConfig).toBeDefined()
    expect(typeof coreIndex.loadConfig).toBe('function')
  })

  it('should instantiate exported classes', () => {
    // 基本的なインスタンス化のテスト
    const config = {
      triggerLabel: 'test',
      cacheDir: '/tmp/test',
    }

    expect(() => new coreIndex.GitHubClient(config)).not.toThrow()
    expect(() => new coreIndex.CacheService('/tmp/test')).not.toThrow()
    expect(() => new coreIndex.ClaudeInvoker()).not.toThrow()
    expect(() => new coreIndex.IssueWatcher(config)).not.toThrow()
    expect(() => new coreIndex.Logger('/tmp/test')).not.toThrow()
  })

  it('should have all expected exports', () => {
    const expectedExports = [
      'GitHubClient',
      'CacheService',
      'ClaudeInvoker',
      'IssueWatcher',
      'Logger',
      'loadConfig',
      'getCurrentRepoInfo',
      'checkGitHubCLI',
      'checkGitHubAuth',
    ]

    expectedExports.forEach((exportName) => {
      expect(coreIndex).toHaveProperty(exportName)
    })
  })

  it('should not have unexpected exports', () => {
    const actualExports = Object.keys(coreIndex)
    const expectedExports = [
      'CacheService',
      'ClaudeInvoker',
      'GitHubClient',
      'IssueWatcher',
      'Logger',
      'loadConfig',
      'getCurrentRepoInfo',
      'checkGitHubCLI',
      'checkGitHubAuth',
    ]

    // すべての実際のエクスポートが期待されるもののいずれかであることを確認
    actualExports.forEach((exportName) => {
      expect(expectedExports).toContain(exportName)
    })

    // 期待されるエクスポートの数と実際のエクスポートの数が一致することを確認
    expect(actualExports).toHaveLength(expectedExports.length)
  })
})
