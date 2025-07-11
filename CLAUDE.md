# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ccradarは、GitHub Issue監視とClaude Code自動実行ツールです。自分がassigneeのIssueに特定のラベルが付与されると、Claude CLIを自動実行して実装タスクを自動化します。

## 開発コマンド

### 基本コマンド
```bash
# 開発モード起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test                  # ユニットテスト
pnpm test:integration      # 統合テスト
pnpm test:all             # 全テスト実行

# コード品質チェック（必ずコミット前に実行）
pnpm lint                 # Biomeによるリントチェック
pnpm lint:fix            # リントエラー自動修正
pnpm typecheck           # TypeScript型チェック
pnpm similarity:strict   # コード類似度チェック（90%閾値）
```

### 単体テストの実行
```bash
# 特定のテストファイルのみ実行
pnpm test packages/core/src/__tests__/githubClient.test.ts

# 特定のテストケースのみ実行
pnpm test -t "should fetch assigned issues"

# カバレッジ付きで実行
pnpm test:coverage
```

## アーキテクチャ

### モノレポ構造
```
packages/
├── core/        # ビジネスロジック（GitHub API、キャッシュ、Claude実行）
└── cli/         # UI層（Ink TUIダッシュボード）
```

### 主要コンポーネント

1. **GitHubClient** (`packages/core/src/githubClient.ts`)
   - Octokitを使用したGitHub API クライアント
   - assignee=selfのオープンIssue取得

2. **IssueWatcher** (`packages/core/src/listAssigned.ts`)
   - 60秒間隔でIssueをポーリング
   - ラベル付与イベントの検知
   - キャッシュによる重複実行防止

3. **ClaudeInvoker** (`packages/core/src/claudeInvoker.ts`)
   - `claude -p`コマンドの実行
   - Issue情報を含むプロンプト生成

4. **Dashboard** (`packages/cli/src/ui/dashboard.tsx`)
   - Ink製のReact TUIコンポーネント
   - Issue一覧表示と手動トリガー機能

### データフロー
1. GitHub APIから自分がassigneeのIssueを取得
2. 各Issueのラベルをチェック（デフォルト: `implement`）
3. 新規ラベル付与を検知したらClaude CLIを実行
4. 実行結果をログに記録（`~/.ccradar/logs/`）

## 重要な実装詳細

### 環境変数
```env
GITHUB_TOKEN=              # GitHubトークン（repo:issuesスコープ必須）
GITHUB_REPOS=             # 監視対象リポジトリ（カンマ区切り）
TRIGGER_LABEL=implement   # トリガーラベル
```

### キャッシュ管理
- 実行済みIssueの記録: `~/.ccradar/cache/executed-issues.json`
- ログファイル: `~/.ccradar/logs/[timestamp].log`

### エラーハンドリング
- GitHub API呼び出しは100ms以内のレスポンスを期待
- ネットワークエラー時は次のポーリングサイクルで再試行
- Claude CLI実行エラーはログに記録し、Issueの処理は継続

### 品質基準
- TypeScript strictモード有効
- テストカバレッジ80%以上を維持
- Biomeによるコード品質チェック必須
- コード類似度90%未満を維持

## 開発時の注意点

1. **型安全性**: TypeScriptのstrictモードを使用。型エラーは必ず解消すること
2. **非同期処理**: async/awaitを使用し、適切なエラーハンドリングを行う
3. **テスト**: 新機能追加時は必ずテストを書く（カバレッジ80%以上）
4. **UI更新**: Ink/Reactのレンダリングサイクルに注意（useEffectの依存配列）