import { join } from 'node:path'
import { useApp, useInput } from 'ink'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { ClaudeInvoker } from './claudeInvoker.js'
import type { CLIOptions } from './config.js'
import { loadConfig } from './config.js'
import { IssueWatcher } from './listAssigned.js'
import { Logger } from './logger.js'
import type { Config, ExecutionStatus, Issue } from './types.js'
import { Dashboard } from './ui/dashboard.js'
import { PromptInput } from './ui/promptInput.js'

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
  const [promptMode, setPromptMode] = useState<{ issue: Issue } | null>(null)

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
    // プロンプト入力モード中は処理しない
    if (promptMode) return

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

    if (key.return && issues[selectedIndex]) {
      const issue = issues[selectedIndex]
      setPromptMode({ issue })
    }
  })

  const handlePromptSubmit = useCallback(
    async (prompt: string) => {
      if (!promptMode || !invoker || !logger) return

      const issue = promptMode.issue
      setPromptMode(null)

      await logger.info(`Manual trigger for issue #${issue.number} with custom prompt`)

      try {
        await invoker.invoke(issue, prompt, {
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
    },
    [promptMode, invoker, logger, updateIssueStatus],
  )

  const handlePromptCancel = useCallback(() => {
    setPromptMode(null)
  }, [])

  if (promptMode) {
    return (
      <PromptInput
        issue={promptMode.issue}
        onSubmit={handlePromptSubmit}
        onCancel={handlePromptCancel}
      />
    )
  }

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
