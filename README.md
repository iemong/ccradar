# ccradar

GitHub Issue監視とClaude Code自動実行ツール

## 概要

ccradarは、GitHubで自分がassigneeのIssueに特定のラベルが付いた瞬間、Claude Codeを自動的に呼び出して実装タスクを実行するCLI/TUIツールです。

## 機能

- 🔍 GitHub Issue のリアルタイム監視（60秒間隔）
- 🏷️ 特定ラベル（デフォルト: `implement`）の付与を検知
- 🤖 Claude Code (`claude -p`) の自動実行
- 🛡️ **macOS Sandbox環境によるセキュリティ制限**
- 🖥️ Ink製のインタラクティブTUIダッシュボード
- 📝 実行ログの保存
- ♻️ 重複実行の防止

## 必要要件

- Node.js 22以上
- pnpm
- Claude Code CLI (`claude` コマンド)
- GitHub Personal Access Token (PAT)
- macOS (Sandbox機能使用時)

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
   CCRADAR_WORK_DIR=/path/to/work/directory          # Claude実行時の作業ディレクトリ（オプション）
   CCRADAR_USE_SANDBOX=true                          # Sandbox環境の有効化（オプション）
   CCRADAR_SANDBOX_CONFIG=/path/to/sandbox.sb        # カスタムSandbox設定（オプション）
   ```

## 使用方法

```bash
# TUIモードで起動
ccradar

# または開発モードで起動
pnpm dev

# Sandbox環境で安全に実行
CCRADAR_USE_SANDBOX=true pnpm dev
```

### キーボード操作

- `↑/↓`: Issue選択
- `Enter`: 選択したIssueに対してClaude Codeを手動実行
- `q`: 終了

## セキュリティ機能

ccradarは**macOS Sandbox環境**によるセキュリティ制限をサポートしています。

### Sandbox機能の利点

- ✅ **プロジェクト外への書き込み防止**: 指定されたプロジェクトディレクトリ内のみ操作
- ✅ **システムファイル保護**: システム設定や他のプロジェクトへの影響を防止
- ✅ **GitHub連携維持**: Git、SSH、GitHub CLI操作は継続して利用可能
- ✅ **AIミス軽減**: Claude AIの意図しない操作を制限

### Sandbox使用方法

```bash
# 環境変数で有効化
export CCRADAR_USE_SANDBOX=true

# ccradar実行時に自動でSandbox環境で実行される
pnpm dev

# 手動でClaude Codeを安全に実行したい場合
./run-claude-sandbox.sh
```

### Sandbox設定ファイル

- `claude-ccradar.sb`: ccradar用Sandbox設定
- `claude-sandbox.sb`: 手動実行用Sandbox設定
- `run-claude-sandbox.sh`: 手動実行スクリプト

### セキュリティ制限内容

**書き込み許可:**
- 指定プロジェクトディレクトリ（`CCRADAR_WORK_DIR`）
- Claude設定ディレクトリ（`~/.claude/`）
- Git設定ファイル（`~/.gitconfig`, `~/.ssh/`）

**書き込み禁止:**
- システムディレクトリ（`/usr/`, `/System/`, `/Applications/`）
- 他のプロジェクトディレクトリ
- 重要なシステム設定ファイル

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
│   │       ├── claudeInvoker.ts   # Claude実行 + Sandbox制御
│   │       ├── config.ts          # 設定管理
│   │       └── listAssigned.ts    # Issue監視ロジック
│   └── cli/           # CLIアプリケーション
│       └── src/
│           ├── app.tsx            # メインアプリ
│           └── ui/dashboard.tsx   # TUIダッシュボード
├── claude-ccradar.sb              # ccradar用Sandbox設定
├── claude-sandbox.sb              # 手動実行用Sandbox設定
└── run-claude-sandbox.sh          # 手動実行スクリプト
```

## トラブルシューティング

### Sandbox関連の問題

**1. Sandbox機能が動作しない**
```bash
# sandbox-execコマンドが利用可能か確認
which sandbox-exec

# 権限の確認
ls -la claude-ccradar.sb

# 一時的にSandbox無効化
CCRADAR_USE_SANDBOX=false pnpm dev
```

**2. 権限エラーが発生する場合**
```bash
# Sandbox設定ファイルの確認
cat claude-ccradar.sb

# 作業ディレクトリの権限確認
ls -la $CCRADAR_WORK_DIR

# カスタム設定での実行
CCRADAR_SANDBOX_CONFIG=/path/to/custom.sb pnpm dev
```

**3. MCP（Chrome）操作ができない**
- Sandbox環境ではブラウザ操作に制限があります
- MCPを使用する場合は一時的にSandbox無効化してください

### 一般的な問題

**GitHub API制限**
- Personal Access Tokenの権限を確認
- Rate limitに達した場合は時間を置いて再試行

**Claude CLI接続エラー**
- Claude CLIが正しくインストールされているか確認
- `claude --version` でバージョン確認

## ライセンス

MIT