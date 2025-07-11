import { homedir } from 'node:os'
import { join } from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import type { Config } from './types.js'

export function loadConfig(): Config {
  dotenvConfig()

  const githubToken = process.env.GITHUB_TOKEN
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable is required')
  }

  const reposStr = process.env.GITHUB_REPOS
  if (!reposStr) {
    throw new Error('GITHUB_REPOS environment variable is required')
  }

  const repos = reposStr
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
  if (repos.length === 0) {
    throw new Error('At least one repository must be specified in GITHUB_REPOS')
  }

  const triggerLabel = process.env.TRIGGER_LABEL || 'implement'
  const cacheDir = process.env.CCRADAR_CACHE_DIR || join(homedir(), '.ccradar')
  const claudePath = process.env.CLAUDE_PATH
  const workDir = process.env.CCRADAR_WORK_DIR

  return {
    githubToken,
    repos,
    triggerLabel,
    cacheDir,
    claudePath,
    workDir,
  }
}
