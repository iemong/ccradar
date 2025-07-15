export interface Config {
  githubToken: string
  repos: string[]
  triggerLabel: string
  cacheDir: string
  claudePath?: string
  workDir?: string
  useSandbox?: boolean
  sandboxConfigPath?: string
}

export interface IssueEvent {
  id: string
  issueNumber: number
  repo: string
  action: string
  label: string
  timestamp: string
}

export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'error'

export interface Issue {
  number: number
  title: string
  state: string
  labels: string[]
  assignee: string | null
  repo: string
  url: string
  updatedAt: string
  executionStatus?: ExecutionStatus
  lastExecuted?: Date
  executionError?: string
}
