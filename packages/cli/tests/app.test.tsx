import { render } from 'ink-testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../src/app.js'

// Mock all dependencies
vi.mock('@ccradar/core', () => ({
  ClaudeInvoker: vi.fn(() => ({
    invoke: vi.fn(),
  })),
  IssueWatcher: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    checkForNewLabeledIssues: vi.fn().mockResolvedValue([]),
    getAllAssignedIssues: vi.fn().mockResolvedValue([]),
  })),
  Logger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
  })),
  loadConfig: vi.fn(() => ({
    triggerLabel: 'implement',
    cacheDir: '/tmp/test-cache',
    claudePath: '/usr/local/bin/claude',
  })),
}))

// Mock process.env for test stability
process.env.NODE_ENV = 'test'

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render app title', () => {
    const { lastFrame } = render(<App />)
    expect(lastFrame()).toContain('ccradar - GitHub Issue Monitor')
  })

  it('should show no issues message when no issues found', () => {
    const { lastFrame } = render(<App />)
    expect(lastFrame()).toContain('No assigned issues with trigger label found')
  })

  it('should show last check status', () => {
    const { lastFrame } = render(<App />)
    expect(lastFrame()).toContain('Last check:')
  })
})
