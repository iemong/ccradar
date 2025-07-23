# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ccradarは、GitHub Issue監視とClaude Code自動実行ツールです。自分がassigneeのIssueに特定のラベルが付与されると、Claude CLIを自動実行して実装タスクを自動化します。

## GitHub CLI使用方針

このプロジェクトでは、GitHub操作には**GitHub CLI (`gh`)を優先的に使用**してください：

### 推奨される使用例
```bash
# Issue一覧の取得
gh issue list --assignee @me --state open --json number,title,labels

# Issue詳細の取得
gh issue view <issue-number> --json body,comments

# PR作成
gh pr create --title "feat: 新機能追加" --body "詳細説明"

# ワークフロー実行状況確認
gh run list --workflow=test.yml
```

### GitHub CLIを使用する理由
1. **認証の簡潔性**: 環境変数やトークン管理が不要
2. **出力の構造化**: JSON形式での出力が容易
3. **API制限の回避**: 内部的に最適化されたAPI呼び出し
4. **CLIとの親和性**: シェルスクリプトやCIでの利用が容易

### 実装時の注意点
- 新機能でGitHub APIを呼び出す場合は、まず`gh`コマンドでの実現を検討
- Octokitは`gh`コマンドで対応できない複雑な処理のみに使用
- エラーハンドリングは`gh`コマンドの終了コードを確認

### 現在の実装状況
GitHub CLIベースの実装に移行済みです。認証はGitHub CLIが管理するため、環境変数での設定は不要になりました。現在のディレクトリのGitHubリポジトリを自動的に対象とし、設定はCLI Optionで行います。

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
pnpm test:coverage        # カバレッジ付きテスト

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
   - Personal Access Token認証

2. **IssueWatcher** (`packages/core/src/listAssigned.ts`)
   - 60秒間隔でIssueをポーリング
   - ラベル付与イベントの検知
   - キャッシュによる重複実行防止

3. **ClaudeInvoker** (`packages/core/src/claudeInvoker.ts`)
   - `claude -p`コマンドの実行
   - Issue情報を含むプロンプト生成
   - macOS Sandbox環境対応

4. **Dashboard** (`packages/cli/src/ui/dashboard.tsx`)
   - Ink製のReact TUIコンポーネント
   - Issue一覧表示と手動トリガー機能
   - リアルタイム実行状況表示

### データフロー
1. GitHub APIから自分がassigneeのIssueを取得
2. 各Issueのラベルをチェック（デフォルト: `implement`）
3. 新規ラベル付与を検知したらClaude CLIを実行
4. 実行結果をログに記録（`~/.ccradar/logs/`）

## 重要な実装詳細

### CLI Option設定
設定は環境変数ではなくCLI Optionで管理されます：

```bash
# 利用可能なオプション
--trigger-label <label>     # トリガーラベル（デフォルト: implement）
--cache-dir <dir>          # キャッシュディレクトリ（デフォルト: ~/.ccradar）
--claude-path <path>       # Claude CLIのパス（自動検出）
--work-dir <dir>           # 作業ディレクトリ（デフォルト: 現在のディレクトリ）
--use-sandbox              # Sandbox環境の有効化（macOSのみ）
--sandbox-config <path>    # カスタムSandbox設定ファイル
```

### キャッシュ管理
- 実行済みIssueの記録: `~/.ccradar/cache/executed-issues.json`
- ログファイル: `~/.ccradar/logs/[timestamp].log`
- キャッシュディレクトリ: `~/.ccradar/`

### エラーハンドリング
- GitHub API呼び出しは100ms以内のレスポンスを期待
- ネットワークエラー時は次のポーリングサイクルで再試行
- Claude CLI実行エラーはログに記録し、Issueの処理は継続

### Sandbox環境（macOS）
- `sandbox-exec`コマンドを使用したプロセス隔離
- 書き込み許可: 作業ディレクトリ、Claude設定、Git設定のみ
- システムファイルとその他のプロジェクトへの書き込み禁止
- Sandbox設定ファイル: `claude-ccradar.sb`

### 品質基準
- TypeScript strictモード有効
- テストカバレッジ80%以上を維持
- Biomeによるコード品質チェック必須
- コード類似度90%未満を維持
- Lefthookによるpre-commit/pre-pushフック

## 開発時の注意点

1. **型安全性**: TypeScriptのstrictモードを使用。型エラーは必ず解消すること
2. **非同期処理**: async/awaitを使用し、適切なエラーハンドリングを行う
3. **テスト**: 新機能追加時は必ずテストを書く（カバレッジ80%以上）
4. **UI更新**: Ink/Reactのレンダリングサイクルに注意（useEffectの依存配列）
5. **セキュリティ**: センシティブなデータはログやGitに含めない（GitHub認証はGitHub CLIが管理）
6. **Sandbox対応**: macOSでSandbox有効時はファイルアクセス制限を考慮
7. **設定管理**: 環境変数ではなくCLI Optionを使用して設定を管理