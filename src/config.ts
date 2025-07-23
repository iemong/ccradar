import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Config } from './types.js'

export interface CLIOptions {
  triggerLabel?: string
  cacheDir?: string
  claudePath?: string
  workDir?: string
  useSandbox?: boolean
  sandboxConfig?: string
}

export function loadConfig(cliOptions: CLIOptions = {}): Config {
  const triggerLabel = cliOptions.triggerLabel || 'implement'
  const cacheDir = cliOptions.cacheDir || join(homedir(), '.ccradar')
  const claudePath = cliOptions.claudePath
  const workDir = cliOptions.workDir
  const useSandbox = cliOptions.useSandbox || false
  const sandboxConfigPath = cliOptions.sandboxConfig
  return {
    triggerLabel,
    cacheDir,
    claudePath,
    workDir,
    useSandbox,
    sandboxConfigPath,
  }
}
