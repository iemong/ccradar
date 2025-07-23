import { type Options as ExecaOptions, execa } from 'execa'
import type { ExecutionStatus, Issue } from './types.js'

export interface ClaudeInvokeOptions {
  cwd?: string
  stdout?: NodeJS.WritableStream
  stderr?: NodeJS.WritableStream
  useSandbox?: boolean
  sandboxConfigPath?: string
  onStatusChange?: (issueNumber: number, status: ExecutionStatus, error?: string) => void
}

export interface ClaudeInvokerConfig {
  claudePath?: string
  workDir?: string
  useSandbox?: boolean
  sandboxConfigPath?: string
}

export class ClaudeInvoker {
  private config?: ClaudeInvokerConfig

  constructor(config?: ClaudeInvokerConfig) {
    this.config = config
  }

  private getClaudeCommand(): string {
    // Check for common Claude CLI locations
    const possiblePaths = [
      this.config?.claudePath,
      '/Users/iemong/.claude/local/claude',
      process.env.CLAUDE_PATH,
      'claude',
    ].filter(Boolean)

    return possiblePaths[0] || 'claude'
  }

  async invoke(issue: Issue, options?: ClaudeInvokeOptions): Promise<void>
  async invoke(issue: Issue, customPrompt?: string, options?: ClaudeInvokeOptions): Promise<void>
  async invoke(
    issue: Issue,
    customPromptOrOptions?: string | ClaudeInvokeOptions,
    options?: ClaudeInvokeOptions,
  ): Promise<void> {
    // オーバーロード解決
    let customPrompt: string | undefined
    let invokeOptions: ClaudeInvokeOptions | undefined

    if (typeof customPromptOrOptions === 'string') {
      customPrompt = customPromptOrOptions
      invokeOptions = options
    } else {
      invokeOptions = customPromptOrOptions
    }

    const prompt = customPrompt || this.buildPrompt(issue)
    const useSandbox = invokeOptions?.useSandbox ?? this.config?.useSandbox ?? false
    const workDir = invokeOptions?.cwd || this.config?.workDir || process.cwd()

    const execaOptions: ExecaOptions = {
      cwd: workDir,
      stdio: ['inherit', 'pipe', 'pipe'],
    }

    // Notify execution started
    invokeOptions?.onStatusChange?.(issue.number, 'running')

    console.log(`\n🚀 Invoking Claude for issue #${issue.number}: ${issue.title}`)
    console.log(`📝 Repository: ${issue.repo}`)
    console.log(`🏷️  Labels: ${issue.labels.join(', ')}`)
    console.log(`📂 Working directory: ${workDir}`)

    let command: string
    let args: string[]

    if (useSandbox) {
      const sandboxConfigPath =
        invokeOptions?.sandboxConfigPath ||
        this.config?.sandboxConfigPath ||
        `${workDir}/claude-ccradar.sb`

      command = 'sandbox-exec'
      args = [
        '-f',
        sandboxConfigPath,
        '-D',
        `WORK_DIR=${workDir}`,
        '-D',
        `HOME_DIR=${process.env.HOME}`,
        this.getClaudeCommand(),
        '-p',
        prompt,
      ]

      console.log(`🔒 Sandbox mode: ENABLED`)
      console.log(`📋 Sandbox config: ${sandboxConfigPath}`)
    } else {
      command = this.getClaudeCommand()
      args = ['-p', prompt]

      console.log(`⚠️  Sandbox mode: DISABLED`)
    }

    console.log(`🤖 Command: ${command} ${args.join(' ')}`)
    console.log('-'.repeat(80))

    try {
      const subprocess = execa(command, args, execaOptions)

      if (invokeOptions?.stdout && subprocess.stdout) {
        subprocess.stdout.pipe(invokeOptions.stdout)
      } else if (subprocess.stdout) {
        subprocess.stdout.on('data', (chunk) => {
          process.stdout.write(chunk)
        })
      }

      if (invokeOptions?.stderr && subprocess.stderr) {
        subprocess.stderr.pipe(invokeOptions.stderr)
      } else if (subprocess.stderr) {
        subprocess.stderr.on('data', (chunk) => {
          process.stderr.write(chunk)
        })
      }

      await subprocess

      console.log(`\n${'-'.repeat(80)}`)
      console.log('✅ Claude execution completed successfully')

      // Notify execution completed
      invokeOptions?.onStatusChange?.(issue.number, 'completed')
    } catch (error) {
      console.error('\n❌ Claude execution failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Notify execution failed
      invokeOptions?.onStatusChange?.(issue.number, 'error', errorMessage)
      throw error
    }
  }

  private buildPrompt(issue: Issue): string {
    return `GitHub Issue実装タスク:

リポジトリ: ${issue.repo}
Issue番号: #${issue.number}
タイトル: ${issue.title}
URL: ${issue.url}
ラベル: ${issue.labels.join(', ')}

このIssueの内容を確認し、必要な実装を行ってください。
実装完了後は、適切なコミットメッセージでコミットし、PRを作成してください。`
  }
}
