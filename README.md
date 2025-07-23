# ccradar

GitHub Issue監視とClaude Code自動実行ツール

## 概要

ccradarは、GitHubで自分がassigneeのIssueに特定のラベルが付いた瞬間、Claude Codeを自動的に呼び出して実装タスクを実行するCLI/TUIツールです。

## 機能

- 🔍 GitHub Issue のリアルタイム監視（60秒間隔）
- 🏷️ 特定ラベル（デフォルト: `implement`）の付与を検知
- 🤖 Claude Code (`claude -p`) の自動実行
- 📊 **実行状況のリアルタイム可視化**（実行中、完了、エラー状態）
- 🛡️ **macOS Sandbox環境によるセキュリティ制限**
- 🖥️ Ink製のインタラクティブTUIダッシュボード
- 📝 実行ログの保存
- ♻️ 重複実行の防止
- ❌ エラー発生時の詳細表示

## 必要要件

- Node.js 22以上
- pnpm
- Claude Code CLI (`claude` コマンド)
- GitHub CLI (`gh` コマンド) - インストールと認証が必要
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

1. GitHub CLIの認証:
   ```bash
   # GitHub CLIをインストール（未インストールの場合）
   # macOS: brew install gh
   # その他: https://cli.github.com/

   # GitHub認証
   gh auth login
   ```

2. 設定はCLIオプションで指定（環境変数は不要）:
   ```bash
   # 使用可能なオプション
   ccradar --help
   
   # カスタム設定での実行例
   ccradar --trigger-label auto-implement --cache-dir /custom/cache --use-sandbox
   ```

## 使用方法

現在のディレクトリがGitHubリポジトリ内である必要があります。

```bash
# プロジェクトのGitHubリポジトリディレクトリに移動
cd /path/to/your/github/repository

# npxで直接実行（推奨）
npx ccradar

# またはローカルビルドしたバイナリで実行
pnpm start

# 開発モード（デバッグ情報付き）
pnpm dev

# CLI オプションを使った実行例
ccradar --trigger-label implement --cache-dir ~/.ccradar --use-sandbox
ccradar --claude-path /usr/local/bin/claude --work-dir /custom/work
ccradar --sandbox-config /custom/sandbox.sb
```

### CLI オプション一覧

| オプション | 短縮形 | 説明 | デフォルト値 |
|-----------|-------|-----|------------|
| `--trigger-label <label>` | `-l` | トリガーラベル | `implement` |
| `--cache-dir <dir>` | `-c` | キャッシュディレクトリ | `~/.ccradar` |
| `--claude-path <path>` | `-p` | Claude CLIのパス | 自動検出 |
| `--work-dir <dir>` | `-w` | 作業ディレクトリ | 現在のディレクトリ |
| `--use-sandbox` | `-s` | Sandbox環境を使用 | `false` |
| `--sandbox-config <path>` | | Sandboxの設定ファイルパス | デフォルト設定 |
| `--help` | | ヘルプを表示 | |
| `--version` | | バージョンを表示 | |

### キーボード操作

- `↑/↓`: Issue選択
- `Enter`: 選択したIssueに対してClaude Codeを手動実行
- `q`: 終了

### Dashboard UI

TUIダッシュボードでは、Issue一覧と実行状況がリアルタイムで表示されます：

- **実行ステータス表示**:
  - ⏸️ 待機中（idle）
  - 🚀 実行中（running） - スピナー付きアニメーション表示
  - ✅ 実行完了（completed）
  - ❌ エラー発生（error） - エラーメッセージも表示

- **表示情報**:
  - Issue番号とタイトル
  - 現在のラベル一覧
  - 最終実行時刻
  - エラー発生時の詳細メッセージ

## セキュリティ機能

ccradarは**macOS Sandbox環境**によるセキュリティ制限をサポートしています。

### Sandbox機能の利点

- ✅ **プロジェクト外への書き込み防止**: 指定されたプロジェクトディレクトリ内のみ操作
- ✅ **システムファイル保護**: システム設定や他のプロジェクトへの影響を防止
- ✅ **GitHub連携維持**: Git、SSH、GitHub CLI操作は継続して利用可能
- ✅ **AIミス軽減**: Claude AIの意図しない操作を制限

### Sandbox使用方法

```bash
# CLI オプションで有効化
ccradar --use-sandbox

# カスタムSandbox設定を使用
ccradar --use-sandbox --sandbox-config /path/to/custom.sb

# 開発モードでSandbox使用
pnpm dev -- --use-sandbox

# 手動でClaude Codeを安全に実行したい場合
./run-claude-sandbox.sh
```

### Sandbox設定ファイル

- `claude-ccradar.sb`: ccradar用Sandbox設定
- `claude-sandbox.sb`: 手動実行用Sandbox設定
- `run-claude-sandbox.sh`: 手動実行スクリプト

### セキュリティ制限内容

**書き込み許可:**
- 指定プロジェクトディレクトリ（`--work-dir`で指定）
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
pnpm test                  # ユニットテスト
pnpm test:watch           # ユニットテスト（ウォッチモード）
pnpm test:coverage        # カバレッジ付きテスト
pnpm test:coverage:watch  # カバレッジ付き（ウォッチモード）
pnpm test:integration     # 統合テスト
pnpm test:integration:watch # 統合テスト（ウォッチモード）
pnpm test:all            # 全テスト実行

# リント実行
pnpm lint                 # Biomeによるリントチェック
pnpm lint:fix            # リントエラー自動修正（フォーマット含む）

# 型チェック
pnpm typecheck           # TypeScript型チェック

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
│   │       ├── listAssigned.ts    # Issue監視ロジック
│   │       ├── logger.ts          # ログ管理
│   │       ├── types.ts           # 型定義
│   │       └── index.ts           # エクスポート管理
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
ccradar  # --use-sandboxオプションを付けずに実行
```

**2. 権限エラーが発生する場合**
```bash
# Sandbox設定ファイルの確認
cat claude-ccradar.sb

# 作業ディレクトリの権限確認
ls -la /path/to/work/dir

# カスタム設定での実行
ccradar --use-sandbox --sandbox-config /path/to/custom.sb
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