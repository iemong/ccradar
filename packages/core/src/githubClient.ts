import { Octokit } from '@octokit/rest'
import type { Config, Issue } from './types.js'

export class GitHubClient {
  private octokit: Octokit
  private config: Config

  constructor(config: Config) {
    this.config = config
    this.octokit = new Octokit({
      auth: config.githubToken,
    })
  }

  async getAssignedIssues(username: string): Promise<Issue[]> {
    const issues: Issue[] = []

    for (const repoFullName of this.config.repos) {
      const [owner, repo] = repoFullName.split('/')
      if (!owner || !repo) {
        console.error(`Invalid repo format: ${repoFullName}`)
        continue
      }

      try {
        const response = await this.octokit.issues.listForRepo({
          owner,
          repo,
          assignee: username,
          state: 'open',
          per_page: 100,
        })

        const repoIssues = response.data.map((issue) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          labels: issue.labels.map((label) =>
            typeof label === 'string' ? label : label.name || '',
          ),
          assignee: issue.assignee?.login || null,
          repo: repoFullName,
          url: issue.html_url,
          updatedAt: issue.updated_at,
        }))

        issues.push(...repoIssues)
      } catch (error) {
        console.error(`Failed to fetch issues for ${repoFullName}:`, error)
      }
    }

    return issues
  }

  async getCurrentUser(): Promise<string> {
    const { data } = await this.octokit.users.getAuthenticated()
    return data.login
  }

  async getIssueEvents(owner: string, repo: string, issueNumber: number) {
    const response = await this.octokit.issues.listEvents({
      owner,
      repo,
      issue_number: issueNumber,
      per_page: 100,
    })
    return response.data
  }
}
