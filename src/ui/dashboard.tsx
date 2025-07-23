import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type React from 'react'
import type { ExecutionStatus, Issue } from '../types.js'

interface DashboardProps {
  issues: Issue[]
  loading: boolean
  selectedIndex: number
  lastCheck: Date | null
  error: string | null
}

export const Dashboard: React.FC<DashboardProps> = ({
  issues,
  loading,
  selectedIndex,
  lastCheck,
  error,
}) => {
  const formatTitle = (title: string): string => {
    return title.length > 35 ? `${title.substring(0, 32)}...` : title
  }

  const getStatusIcon = (status?: ExecutionStatus): string => {
    switch (status) {
      case 'running':
        return '🚀'
      case 'completed':
        return '✅'
      case 'error':
        return '❌'
      default:
        return '⏸️'
    }
  }

  const getStatusColor = (status?: ExecutionStatus): string => {
    switch (status) {
      case 'running':
        return 'yellow'
      case 'completed':
        return 'green'
      case 'error':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <Box flexDirection="column" paddingTop={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          ccradar - GitHub Issue Monitor
        </Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text>
          {loading && (
            <>
              <Spinner type="dots" />{' '}
            </>
          )}
          <Text color="gray">
            {loading
              ? 'Checking for issues...'
              : `Last check: ${lastCheck?.toLocaleTimeString() || 'Never'}`}
          </Text>
        </Text>
      </Box>

      {issues.length > 0 ? (
        <>
          <Box flexDirection="column" marginBottom={1}>
            <Box>
              <Text bold>
                {' '.repeat(3)}
                {'#'.padEnd(6)}
                {'Title'.padEnd(37)}
                {'Status'.padEnd(8)}
                {'Labels'.padEnd(18)}
                {'Repo'}
              </Text>
            </Box>
            <Box>
              <Text color="gray">{'-'.repeat(100)}</Text>
            </Box>
            {issues.map((issue, index) => (
              <Box key={issue.number}>
                <Text color={index === selectedIndex ? 'yellow' : undefined}>
                  {index === selectedIndex ? ' > ' : '   '}
                  {issue.number.toString().padEnd(6)}
                  {formatTitle(issue.title).padEnd(37)}
                </Text>
                <Text color={getStatusColor(issue.executionStatus)}>
                  {getStatusIcon(issue.executionStatus)}{' '}
                  {issue.executionStatus === 'running' ? (
                    <>
                      <Spinner type="dots" /> running
                    </>
                  ) : (
                    issue.executionStatus || 'idle'
                  )}
                  {''.padEnd(Math.max(0, 6 - (issue.executionStatus || 'idle').length))}
                </Text>
                <Text color={index === selectedIndex ? 'yellow' : undefined}>
                  {issue.labels.join(', ').substring(0, 16).padEnd(18)}
                  {issue.repo}
                </Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text color="gray">Use ↑/↓ to select, Enter to trigger Claude, q to quit</Text>
          </Box>
        </>
      ) : (
        <Box marginTop={1}>
          <Text color="gray">No assigned issues with trigger label found</Text>
        </Box>
      )}
    </Box>
  )
}
