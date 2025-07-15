import { homedir } from 'node:os'
import { join } from 'node:path'
import { config as dotenvConfig } from 'dotenv'
import type { Config } from './types.js'

export function loadConfig(): Config {
  // Node.js 20.6+ では --env-file フラグで.envを読み込み済み
  // 念のためdotenvも実行（既存の環境変数は上書きされない）
  dotenvConfig()

  const githubToken = process.env.CCRADAR_GITHUB_TOKEN
  if (!githubToken) {
    throw new Error('CCRADAR_GITHUB_TOKEN environment variable is required')
  }

  const reposStr = process.env.CCRADAR_GITHUB_REPOS
  if (!reposStr) {
    throw new Error('CCRADAR_GITHUB_REPOS environment variable is required')
  }

  const repos = reposStr
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean)
  if (repos.length === 0) {
    throw new Error('At least one repository must be specified in CCRADAR_GITHUB_REPOS')
  }

  const triggerLabel = process.env.TRIGGER_LABEL || 'implement'
  const cacheDir = process.env.CCRADAR_CACHE_DIR || join(homedir(), '.ccradar')
  const claudePath = process.env.CLAUDE_PATH
  const workDir = process.env.CCRADAR_WORK_DIR
  const useSandbox = process.env.CCRADAR_USE_SANDBOX === 'true'
  const sandboxConfigPath = process.env.CCRADAR_SANDBOX_CONFIG

  return {
    githubToken,
    repos,
    triggerLabel,
    cacheDir,
    claudePath,
    workDir,
    useSandbox,
    sandboxConfigPath,
  }
}
