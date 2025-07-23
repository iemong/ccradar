import { describe, expect, it } from 'vitest'
import { loadConfig } from '../src/config.js'

describe('Config', () => {
  describe('loadConfig', () => {
    it('should load basic configuration with defaults', () => {
      const config = loadConfig()

      expect(config.triggerLabel).toBe('implement')
      expect(config.cacheDir).toContain('.ccradar')
      expect(config.useSandbox).toBe(false)
    })

    it('should use CLI options for trigger label', () => {
      const config = loadConfig({ triggerLabel: 'auto-implement' })

      expect(config.triggerLabel).toBe('auto-implement')
    })

    it('should use CLI options for cache directory', () => {
      const config = loadConfig({ cacheDir: '/custom/cache/dir' })

      expect(config.cacheDir).toBe('/custom/cache/dir')
    })

    it('should use CLI options for Claude path', () => {
      const config = loadConfig({ claudePath: '/custom/claude/path' })

      expect(config.claudePath).toBe('/custom/claude/path')
    })

    it('should use CLI options for working directory', () => {
      const config = loadConfig({ workDir: '/custom/work/dir' })

      expect(config.workDir).toBe('/custom/work/dir')
    })

    it('should return undefined for workDir if not provided', () => {
      const config = loadConfig()

      expect(config.workDir).toBeUndefined()
    })

    it('should use CLI options for sandbox configuration', () => {
      const config = loadConfig({
        useSandbox: true,
        sandboxConfig: '/custom/sandbox.sb',
      })

      expect(config.useSandbox).toBe(true)
      expect(config.sandboxConfigPath).toBe('/custom/sandbox.sb')
    })

    it('should default to no sandbox when not specified', () => {
      const config = loadConfig()

      expect(config.useSandbox).toBe(false)
      expect(config.sandboxConfigPath).toBeUndefined()
    })

    it('should handle explicit false for sandbox flag', () => {
      const config = loadConfig({ useSandbox: false })

      expect(config.useSandbox).toBe(false)
    })

    it('should override defaults with CLI options', () => {
      const config = loadConfig({
        triggerLabel: 'custom-label',
        cacheDir: '/custom/cache',
        claudePath: '/custom/claude',
        workDir: '/custom/work',
        useSandbox: true,
        sandboxConfig: '/custom/sandbox.sb',
      })

      expect(config.triggerLabel).toBe('custom-label')
      expect(config.cacheDir).toBe('/custom/cache')
      expect(config.claudePath).toBe('/custom/claude')
      expect(config.workDir).toBe('/custom/work')
      expect(config.useSandbox).toBe(true)
      expect(config.sandboxConfigPath).toBe('/custom/sandbox.sb')
    })
  })
})
