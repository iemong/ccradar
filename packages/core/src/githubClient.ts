import { execSync } from 'node:child_process'
import { checkGitHubAuth, checkGitHubCLI, getCurrentRepoInfo } from './repoUtils.js'
import type { Config, Issue } from './types.js'

export class GitHubClient {
  private config: Config
  private workingDirectory: string

  constructor(config: Config, workingDirectory: string = process.cwd()) {
    this.config = config
    this.workingDirectory = workingDirectory
  }

  async initialize(): Promise<void> {
    // GitHub CLIの存在確認
    if (!(await checkGitHubCLI())) {
      throw new Error(
        'GitHub CLI (gh) is not installed. Please install it first: https://cli.github.com/',
      )
    }

    // GitHub CLI認証確認
    if (!(await checkGitHubAuth())) {
      throw new Error('GitHub CLI is not authenticated. Please run "gh auth login" first.')
    }
  }

  async getAssignedIssues(): Promise<Issue[]> {
    // 現在のディレクトリからリポジトリ情報を取得
    const repoInfo = await getCurrentRepoInfo(this.workingDirectory)
    if (!repoInfo) {
      throw new Error(
        'Not in a GitHub repository. Please run ccradar from within a GitHub repository.',
      )
    }

    try {
      // GitHub CLIでIssue一覧を取得
      const output = execSync(
        'gh issue list --assignee @me --state open --json number,title,labels,url,updatedAt',
        {
          cwd: this.workingDirectory,
          encoding: 'utf8',
          stdio: 'pipe',
        },
      )

      const issuesData = JSON.parse(output)

      type GitHubIssue = {
        number: number
        title: string
        labels: Array<{ name: string }>
        url: string
        updatedAt: string
      }

      return issuesData.map((issue: GitHubIssue) => ({
        number: issue.number,
        title: issue.title,
        state: 'open' as const,
        labels: issue.labels.map((label) => label.name),
        assignee: null, // GitHub CLIでは@meでフィルタしているので自分がassignee
        repo: repoInfo.fullName,
        url: issue.url,
        updatedAt: issue.updatedAt,
      }))
    } catch (error) {
      console.error(`Failed to fetch issues for ${repoInfo.fullName}:`, error)
      return []
    }
  }

  async getCurrentUser(): Promise<string> {
    try {
      const output = execSync('gh api user --jq .login', {
        encoding: 'utf8',
        stdio: 'pipe',
      })
      return output.trim()
    } catch (_error) {
      throw new Error('Failed to get current user from GitHub CLI')
    }
  }

  async getIssueEvents(owner: string, repo: string, issueNumber: number) {
    try {
      const output = execSync(`gh api repos/${owner}/${repo}/issues/${issueNumber}/events`, {
        encoding: 'utf8',
        stdio: 'pipe',
      })
      return JSON.parse(output)
    } catch (error) {
      console.error(`Failed to fetch events for issue #${issueNumber}:`, error)
      return []
    }
  }
}
