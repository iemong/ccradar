# ccradar

GitHub Issue監視とClaude Code自動実行ツール

## 概要

ccradarは、GitHubで自分がassigneeのIssueに特定のラベルが付いた瞬間、Claude Codeを自動的に呼び出して実装タスクを実行するCLI/TUIツールです。

## 機能

- 🔍 GitHub Issue のリアルタイム監視（60秒間隔）
- 🏷️ 特定ラベル（デフォルト: `implement`）の付与を検知
- 🤖 Claude Code (`claude -p`) の自動実行
- 🖥️ Ink製のインタラクティブTUIダッシュボード
- 📝 実行ログの保存
- ♻️ 重複実行の防止

## 必要要件

- Node.js 22以上
- pnpm
- Claude Code CLI (`claude` コマンド)
- GitHub Personal Access Token (PAT)

## インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/ccradar.git
cd ccradar

# 依存関係のインストール
pnpm install

# ビルド
pnpm build

# グローバルインストール（オプション）
cd packages/cli
npm link
```

## 設定

1. `.env.example` を `.env` にコピー:
   ```bash
   cp .env.example .env
   ```

2. `.env` ファイルを編集:
   ```env
   GITHUB_TOKEN=your_github_token_here
   GITHUB_REPOS=owner/repo1,owner/repo2
   TRIGGER_LABEL=implement
   CCRADAR_WORK_DIR=/path/to/work/directory  # Claude実行時の作業ディレクトリ（オプション）
   ```

## 使用方法

```bash
# TUIモードで起動
ccradar

# または開発モードで起動
pnpm dev
```

### キーボード操作

- `↑/↓`: Issue選択
- `Enter`: 選択したIssueに対してClaude Codeを手動実行
- `q`: 終了

## 開発

```bash
# 開発モード（ファイル変更監視）
pnpm dev

# テスト実行
pnpm test

# リント実行
pnpm lint

# フォーマット
pnpm format

# コード類似度チェック
pnpm similarity          # デフォルト閾値(87%)
pnpm similarity:strict   # 厳密チェック(90%)
```

## アーキテクチャ

```
ccradar/
├── packages/
│   ├── core/          # コアライブラリ
│   │   └── src/
│   │       ├── githubClient.ts    # GitHub API クライアント
│   │       ├── cacheService.ts    # キャッシュ管理
│   │       ├── claudeInvoker.ts   # Claude実行
│   │       └── listAssigned.ts    # Issue監視ロジック
│   └── cli/           # CLIアプリケーション
│       └── src/
│           ├── app.tsx            # メインアプリ
│           └── ui/dashboard.tsx   # TUIダッシュボード
```

## ライセンス

MIT