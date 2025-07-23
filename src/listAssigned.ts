import { CacheService } from './cacheService.js'
import { GitHubClient } from './githubClient.js'
import type { Config, Issue, IssueEvent } from './types.js'

export class IssueWatcher {
  private githubClient: GitHubClient
  private cacheService: CacheService
  private config: Config
  private workingDirectory: string

  constructor(config: Config, workingDirectory: string = process.cwd()) {
    this.config = config
    this.workingDirectory = workingDirectory
    this.githubClient = new GitHubClient(config, workingDirectory)
    this.cacheService = new CacheService(config.cacheDir)
  }

  async initialize(): Promise<void> {
    await this.githubClient.initialize()
  }

  async checkForNewLabeledIssues(): Promise<Issue[]> {
    const issues = await this.githubClient.getAssignedIssues()

    const triggeredIssues: Issue[] = []

    for (const issue of issues) {
      if (!issue.labels.includes(this.config.triggerLabel)) {
        continue
      }

      const [owner, repo] = issue.repo.split('/')
      if (!owner || !repo) continue

      try {
        const events = await this.githubClient.getIssueEvents(owner, repo, issue.number)

        for (const event of events) {
          if (
            event.event === 'labeled' &&
            'label' in event &&
            event.label?.name === this.config.triggerLabel
          ) {
            const issueEvent: IssueEvent = {
              id: `${issue.repo}#${issue.number}:${event.id}`,
              issueNumber: issue.number,
              repo: issue.repo,
              action: 'labeled',
              label: event.label.name,
              timestamp: event.created_at,
            }

            const eventId = this.cacheService.generateEventId(issueEvent)
            const isProcessed = await this.cacheService.isEventProcessed(eventId)

            if (!isProcessed) {
              triggeredIssues.push(issue)
              await this.cacheService.addProcessedEvent(eventId)
              break
            }
          }
        }
      } catch (error) {
        console.error(`Failed to check events for ${issue.repo}#${issue.number}:`, error)
      }
    }

    return triggeredIssues
  }

  async getAllAssignedIssues(): Promise<Issue[]> {
    return this.githubClient.getAssignedIssues()
  }
}
