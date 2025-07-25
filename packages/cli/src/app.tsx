import { join } from 'node:path'
import type { CLIOptions } from '@ccradar/core'
import {
  ClaudeInvoker,
  type Config,
  type ExecutionStatus,
  type Issue,
  IssueWatcher,
  Logger,
  loadConfig,
} from '@ccradar/core'
import { useApp, useInput } from 'ink'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Dashboard } from './ui/dashboard.js'

const POLLING_INTERVAL = 60000 // 60 seconds

export const App: React.FC<{ cliOptions: CLIOptions }> = ({ cliOptions }) => {
  const { exit } = useApp()
  const [issues, setIssues] = useState<Issue[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [_config, setConfig] = useState<Config | null>(null)
  const [watcher, setWatcher] = useState<IssueWatcher | null>(null)
  const [invoker, setInvoker] = useState<ClaudeInvoker | null>(null)
  const [logger, setLogger] = useState<Logger | null>(null)

  const updateIssueStatus = useCallback(
    (issueNumber: number, status: ExecutionStatus, error?: string) => {
      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
          issue.number === issueNumber
            ? {
                ...issue,
                executionStatus: status,
                lastExecuted: new Date(),
                executionError: error,
              }
            : issue,
        ),
      )
    },
    [],
  )

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const cfg = loadConfig(cliOptions)
        setConfig(cfg)

        const workingDirectory = cfg.workDir || process.cwd()
        const issueWatcher = new IssueWatcher(cfg, workingDirectory)

        // GitHub CLIの初期化
        await issueWatcher.initialize()
        setWatcher(issueWatcher)

        const claudeInvoker = new ClaudeInvoker({
          claudePath: cfg.claudePath,
          workDir: cfg.workDir,
          useSandbox: cfg.useSandbox,
          sandboxConfigPath: cfg.sandboxConfigPath,
        })
        setInvoker(claudeInvoker)

        const logger = new Logger(join(cfg.cacheDir, 'logs'))
        setLogger(logger)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration'
        setError(errorMessage)
      }
    }

    initializeApp()
  }, [cliOptions])

  const checkIssues = useCallback(async () => {
    if (!watcher || !logger) return

    setLoading(true)
    setError(null)

    try {
      await logger.info('Checking for new labeled issues')

      // Check for new labeled issues
      const newIssues = await watcher.checkForNewLabeledIssues()

      if (newIssues.length > 0) {
        await logger.info(`Found ${newIssues.length} new labeled issues`, { issues: newIssues })

        // Auto-invoke Claude for new issues
        for (const issue of newIssues) {
          if (invoker) {
            await logger.info(`Auto-invoking Claude for issue #${issue.number}`)
            await invoker.invoke(issue, {
              onStatusChange: updateIssueStatus,
            })
          }
        }
      }

      // Get all assigned issues for display
      const allIssues = await watcher.getAllAssignedIssues()
      setIssues(
        allIssues.map((issue) => ({
          ...issue,
          executionStatus: issue.executionStatus || 'idle',
        })),
      )
      setLastCheck(new Date())

      await logger.info(`Found ${allIssues.length} total assigned issues`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      await logger.error('Failed to check issues', { error: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [watcher, invoker, logger, updateIssueStatus])

  // Initial check and polling
  useEffect(() => {
    if (watcher) {
      checkIssues()
      const interval = setInterval(checkIssues, POLLING_INTERVAL)
      return () => clearInterval(interval)
    }
  }, [watcher, checkIssues])

  useInput(async (input: string, key) => {
    if (input === 'q') {
      await logger?.info('Application exit requested')
      exit()
    }

    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }

    if (key.downArrow && selectedIndex < issues.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }

    if (key.return && issues[selectedIndex] && invoker && logger) {
      const issue = issues[selectedIndex]
      await logger.info(`Manual trigger for issue #${issue.number}`)

      try {
        await invoker.invoke(issue, {
          onStatusChange: updateIssueStatus,
        })
        await logger.info(`Successfully invoked Claude for issue #${issue.number}`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        await logger.error(`Failed to invoke Claude for issue #${issue.number}`, {
          error: errorMessage,
        })
        setError(`Failed to invoke Claude: ${errorMessage}`)
      }
    }
  })

  return (
    <Dashboard
      issues={issues}
      loading={loading}
      selectedIndex={selectedIndex}
      lastCheck={lastCheck}
      error={error}
    />
  )
}
