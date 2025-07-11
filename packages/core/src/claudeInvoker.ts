import { type Options as ExecaOptions, execa } from 'execa'
import type { Issue } from './types.js'

export interface ClaudeInvokeOptions {
  cwd?: string
  stdout?: NodeJS.WritableStream
  stderr?: NodeJS.WritableStream
}

export class ClaudeInvoker {
  private config?: { claudePath?: string; workDir?: string }

  constructor(config?: { claudePath?: string; workDir?: string }) {
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

  async invoke(issue: Issue, options?: ClaudeInvokeOptions): Promise<void> {
    const prompt = this.buildPrompt(issue)
    const claudeCommand = this.getClaudeCommand()

    const execaOptions: ExecaOptions = {
      cwd: options?.cwd || this.config?.workDir,
      stdio: ['inherit', 'pipe', 'pipe'],
    }

    console.log(`\n🚀 Invoking Claude for issue #${issue.number}: ${issue.title}`)
    console.log(`📝 Repository: ${issue.repo}`)
    console.log(`🏷️  Labels: ${issue.labels.join(', ')}`)
    console.log(`🤖 Command: ${claudeCommand}`)
    if (execaOptions.cwd) {
      console.log(`📂 Working directory: ${execaOptions.cwd}`)
    }
    console.log('-'.repeat(80))

    try {
      const subprocess = execa(claudeCommand, ['-p', prompt], execaOptions)

      if (options?.stdout && subprocess.stdout) {
        subprocess.stdout.pipe(options.stdout)
      } else if (subprocess.stdout) {
        subprocess.stdout.on('data', (chunk) => {
          process.stdout.write(chunk)
        })
      }

      if (options?.stderr && subprocess.stderr) {
        subprocess.stderr.pipe(options.stderr)
      } else if (subprocess.stderr) {
        subprocess.stderr.on('data', (chunk) => {
          process.stderr.write(chunk)
        })
      }

      await subprocess

      console.log('\n' + '-'.repeat(80))
      console.log('✅ Claude execution completed successfully')
    } catch (error) {
      console.error('\n❌ Claude execution failed:', error)
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
