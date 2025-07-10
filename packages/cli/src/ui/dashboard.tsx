import type { Issue } from '@ccradar/core'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type React from 'react'

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
    return title.length > 40 ? `${title.substring(0, 37)}...` : title
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
                {'Title'.padEnd(42)}
                {'Labels'.padEnd(20)}
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
                  {formatTitle(issue.title).padEnd(42)}
                  {issue.labels.join(', ').substring(0, 18).padEnd(20)}
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
