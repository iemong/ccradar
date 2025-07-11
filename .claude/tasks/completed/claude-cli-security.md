# ccradar Claude CLI セキュリティ強化 - 2025-07-11

## 概要
ccradarが自動実行するClaude CLIにSandbox環境によるセキュリティ制限を追加

## タスクリスト

### 高優先度
- [x] ClaudeInvokerクラスにSandbox環境サポートを追加
  - ファイル: packages/core/src/claudeInvoker.ts:48
  - 完了: sandbox-exec経由での実行オプション追加完了

- [x] ccradar専用Sandbox設定ファイルを作成
  - 完了: claude-ccradar.sb作成
  - 対象ディレクトリの動的指定: WORK_DIR パラメータ
  - GitHub連携に必要な権限設定: Git, SSH, GitHub CLI
  - Claude CLI実行に必要な最小権限: 含む

### 中優先度
- [x] 設定でSandbox使用のオン/オフ切り替え機能
  - 完了: config.ts, types.tsに設定項目追加
  - 完了: 環境変数CCRADAR_USE_SANDBOX, CCRADAR_SANDBOX_CONFIGでの制御

- [x] テストでSandbox機能を検証
  - 完了: claudeInvoker.test.ts更新 - 5つのSandboxテストケース追加
  - 完了: 統合テストにSandbox設定テスト追加

## 進行状況
- 開始: 2025-07-11 
- 完了: 2025-07-11
- 完了: 4/4 ✅

## 実装済み機能
- ClaudeInvokerでのSandbox制御
- 環境変数による設定切り替え
- ccradar専用Sandbox設定ファイル
- 包括的テストカバレッジ

## 注意点
- 既存機能の互換性維持
- GitHub操作に必要な権限確保
- エラーハンドリング強化