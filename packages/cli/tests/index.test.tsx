import { describe, expect, it } from 'vitest'

describe('CLI Entry Point', () => {
  it('should import without throwing', async () => {
    // テストランナーで実行されるため、実際の実行はしないが、importが成功することを確認
    await expect(import('../src/index.js')).resolves.toBeDefined()
  })
})
