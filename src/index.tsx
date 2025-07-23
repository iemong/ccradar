#!/usr/bin/env node
import type { CLIOptions } from '@ccradar/core'
import { program } from 'commander'
import { render } from 'ink'
import { App } from './app.js'

program
  .name('ccradar')
  .description('GitHub Issue監視とClaude Code自動実行ツール')
  .version('1.0.0')
  .option('-l, --trigger-label <label>', 'トリガーラベル', 'implement')
  .option('-c, --cache-dir <dir>', 'キャッシュディレクトリ')
  .option('-p, --claude-path <path>', 'Claude CLIのパス')
  .option('-w, --work-dir <dir>', '作業ディレクトリ')
  .option('-s, --use-sandbox', 'Sandbox環境を使用', false)
  .option('--sandbox-config <path>', 'Sandboxの設定ファイルパス')
  .parse()

const options = program.opts<CLIOptions>()

// TTYチェック
if (!process.stdin.isTTY) {
  console.log('ccradar - GitHub Issue Monitor (read-only mode)')
  console.log('Interactive features require a TTY terminal')
  process.exit(0)
}

render(<App cliOptions={options} />)
