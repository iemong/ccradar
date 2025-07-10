import type { Issue } from '@ccradar/core'
import { render } from 'ink-testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Dashboard } from '../src/ui/dashboard.js'

describe('Dashboard', () => {
  const mockIssues: Issue[] = [
    {
      number: 123,
      title: 'Test Issue',
      state: 'open',
      labels: ['bug', 'implement'],
      assignee: 'testuser',
      repo: 'owner/repo',
      url: 'https://github.com/owner/repo/issues/123',
      updatedAt: '2025-07-10T12:00:00Z',
    },
    {
      number: 456,
      title: 'Another Issue with a Very Long Title That Should Be Truncated',
      state: 'open',
      labels: ['feature', 'implement'],
      assignee: 'testuser',
      repo: 'owner/another-repo',
      url: 'https://github.com/owner/another-repo/issues/456',
      updatedAt: '2025-07-10T13:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard title', () => {
    const { lastFrame } = render(
      <Dashboard issues={[]} loading={false} selectedIndex={0} lastCheck={null} error={null} />,
    )
    expect(lastFrame()).toContain('ccradar - GitHub Issue Monitor')
  })

  it('should show loading state', () => {
    const { lastFrame } = render(
      <Dashboard issues={[]} loading={true} selectedIndex={0} lastCheck={null} error={null} />,
    )
    expect(lastFrame()).toContain('Checking for issues...')
  })

  it('should show error message', () => {
    const { lastFrame } = render(
      <Dashboard
        issues={[]}
        loading={false}
        selectedIndex={0}
        lastCheck={null}
        error="Test error message"
      />,
    )
    expect(lastFrame()).toContain('Error: Test error message')
  })

  it('should show last check time', () => {
    const lastCheck = new Date('2025-07-10T12:00:00Z')
    const { lastFrame } = render(
      <Dashboard
        issues={[]}
        loading={false}
        selectedIndex={0}
        lastCheck={lastCheck}
        error={null}
      />,
    )
    expect(lastFrame()).toContain('Last check:')
  })

  it('should show no issues message when empty', () => {
    const { lastFrame } = render(
      <Dashboard issues={[]} loading={false} selectedIndex={0} lastCheck={null} error={null} />,
    )
    expect(lastFrame()).toContain('No assigned issues with trigger label found')
  })

  it('should display issues with headers', () => {
    const { lastFrame } = render(
      <Dashboard
        issues={mockIssues}
        loading={false}
        selectedIndex={0}
        lastCheck={null}
        error={null}
      />,
    )

    const frame = lastFrame()
    expect(frame).toContain('#')
    expect(frame).toContain('Title')
    expect(frame).toContain('Labels')
    expect(frame).toContain('Repo')
  })

  it('should display issue details', () => {
    const { lastFrame } = render(
      <Dashboard
        issues={mockIssues}
        loading={false}
        selectedIndex={0}
        lastCheck={null}
        error={null}
      />,
    )

    const frame = lastFrame()
    expect(frame).toContain('123')
    expect(frame).toContain('Test Issue')
    expect(frame).toContain('bug, implement')
    expect(frame).toContain('owner/repo')
  })

  it('should highlight selected issue', () => {
    const { lastFrame } = render(
      <Dashboard
        issues={mockIssues}
        loading={false}
        selectedIndex={0}
        lastCheck={null}
        error={null}
      />,
    )

    const frame = lastFrame()
    expect(frame).toContain(' > ')
  })

  it('should truncate long titles', () => {
    const { lastFrame } = render(
      <Dashboard
        issues={mockIssues}
        loading={false}
        selectedIndex={1}
        lastCheck={null}
        error={null}
      />,
    )

    const frame = lastFrame()
    // タイトルが切り捨てられていることを確認（...が含まれている）
    expect(frame).toContain('Another Issue with a Very Long Title ')
    expect(frame).toContain('...')
  })

  it('should show help text when issues are present', () => {
    const { lastFrame } = render(
      <Dashboard
        issues={mockIssues}
        loading={false}
        selectedIndex={0}
        lastCheck={null}
        error={null}
      />,
    )

    const frame = lastFrame()
    expect(frame).toContain('Use ↑/↓ to select, Enter to trigger Claude, q to quit')
  })
})
