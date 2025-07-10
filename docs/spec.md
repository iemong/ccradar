# ccradar — 詳細仕様書  
**Version 1.0 (2025-07-10)**  

---

## 目次
1. [目的と背景](#目的と背景)  
2. [スコープ](#スコープ)  
3. [採用技術](#採用技術)  
4. [機能要件](#機能要件)  
5. [非機能要件](#非機能要件)  
6. [全体アーキテクチャ](#全体アーキテクチャ)  
7. [ディレクトリ構成](#ディレクトリ構成)  
8. [セットアップ手順（人間作業）](#セットアップ手順人間作業)  
9. [詳細実装ステップ（Claude Code 担当）](#詳細実装ステップclaude-code-担当)  
10. [開発ワークフロー](#開発ワークフロー)  
11. [CI / CD 設計](#ci--cd-設計)  
12. [今後の拡張アイデア](#今後の拡張アイデア)  

---

## 目的と背景
GitHub で **自分が assignee** の Issue に特定ラベルが付いた瞬間、  
Claude Code を呼び出して実装タスクを自動化したい。  
ローカル常駐 CLI / TUI **ccradar** が Issue をレーダー監視し、  
トリガを検知したら `claude -p` を発火する。  

---

## スコープ
| 含む | 含まない |
|------|----------|
| • GitHub REST API ポーリング<br>• Ink 製 TUI ダッシュボード<br>• `claude -p` 呼び出し<br>• pnpm / lefthook / Vitest 導入<br>• ESLint / Prettier / CI | • WebHook 版<br>• 並列ワーカー実装<br>• GUI パッケージング (Electron/Tauri) |

---

## 採用技術
| 区分 | ツール / ライブラリ | 備考 |
|------|-------------------|------|
| ランタイム | **Node.js 22 (LTS)** | 2025-07 現在の推奨 LTS |
| PKG マネージャ | pnpm 9.x | ワークスペース対応 |
| CLI / TUI | Ink, ink-table, ink-spinner | React ベース |
| GitHub API | `@octokit/rest` | REST v3 |
| 子プロセス | `execa` | 非同期 `claude` 呼び出し |
| 設定管理 | dotenv | `.env` |
| 品質 | ESLint + Prettier | airbnb-typescript ベース |
| テスト | Vitest | Jest 互換 |
| Git フック | lefthook | pre-commit で lint & test |
| CI | GitHub Actions | Node 22 / pnpm |
| AI 実装 | Claude Code CLI (`claude`) | `claude -p` |

---

## 機能要件
1. **Issue 監視**  
   - `assignee=self` かつ状態 `open` を 60 s 間隔で取得。  
   - 新規 `labeled` イベントで `TRIGGER_LABEL`（既定 `implement`）付与を検知。  
   - 処理済みイベント ID を `~/.cache/ccradar.json` に保存し重複防止。  
2. **Claude Code 起動**  
   - 該当 Issue が見つかったら `claude -p "<テンプレート>"` を同期実行。  
   - 出力を TUI にストリーム表示しログへ保存。  
3. **TUI 操作**  
   - Issue 一覧表を描画。↓↑ で選択、Enter で手動発火。`q` 終了。  
4. **環境変数 (.env)**  

   | 変数 | 説明 |
   |------|------|
   | `GITHUB_TOKEN` | PAT (`repo:issues`) |
   | `GITHUB_REPOS` | `owner1/repo1,owner2/repo2` |
   | `TRIGGER_LABEL` | 監視ラベル（省略時 `implement`） |
5. **ログ**  
   - JSON Lines を `~/.ccradar/logs/YYYYMMDD.log` に追記。  

---

## 非機能要件
| 項目 | 要求 |
|------|------|
| パフォーマンス | API 呼び出し ≤ 100 ms／repo |
| 可搬性 | macOS / Linux (x64・arm64) |
| セキュリティ | トークンは env のみ・平文保存禁止 |
| 拡張性 | コアロジックをライブラリ化 |
| 品質基準 | Vitest カバレッジ ≥ 80 %、ESLint エラー 0 |

---

## 全体アーキテクチャ

┌───────────────┐
│    Ink TUI    │  ← packages/cli/src/ui
└──▲───────────┘
│
┌──┴───────────┐
│ CLI Controller│  ← packages/cli/src/index.tsx
└──▲───────────┘
│
┌──┴───────────┐
│ Core Service │  ← packages/core
│  GitHubClient│
│  CacheSvc    │
│  ClaudeInvoke│
└──▲───────────┘
│
┌──┴───────────┐
│ Infrastructure│
│ Octokit REST  │
│ execa / fs    │
└──────────────┘

---

## ディレクトリ構成

.
├─ packages/
│  ├─ core/
│  │   └─ src/…
│  └─ cli/
│      └─ src/…
├─ .lefthook.yml
├─ pnpm-workspace.yaml
├─ vitest.config.ts
└─ tsconfig.json

---

## セットアップ手順（人間作業）

1. **リポジトリ作成**  
   ```bash
   gh repo create ccradar --public
   cd ccradar

	2.	Node 22 (LTS) を mise で準備

# mise が未インストールなら:
curl https://mise.run | bash
exec $SHELL -l                # シェル再読み込み

# プロジェクト直下で Node 22 を指定
mise use -g node@22           # or: mise use node@22 --path .

# 依存パッケージ用に corepack を有効化
corepack enable

.tool-versions または mise.toml が自動生成され
プロジェクトを clone した他メンバーも mise install だけで同一バージョンを取得可能。

	3.	依存導入

pnpm init -y
pnpm add -D typescript eslint prettier vitest lefthook \
          ink ink-table ink-spinner @octokit/rest dotenv execa


	4.	ワークスペース定義

# pnpm-workspace.yaml
packages:
  - "packages/*"


	5.	Git フック

npx lefthook install


	6.	.env テンプレ作成

GITHUB_TOKEN=
GITHUB_REPOS=
TRIGGER_LABEL=implement


	7.	初回コミット & Push

git add .
git commit -m "chore: bootstrap ccradar"
git push -u origin main



⸻

詳細実装ステップ（Claude Code 担当）

パッケージ	ファイル	役割
core	githubClient.ts	Octokit 初期化
	cacheService.ts	JSON キャッシュ I/O
	claudeInvoker.ts	execa で claude -p
	listAssigned.ts	Issue 取得 & 差分判定
cli	ui/dashboard.tsx	Ink テーブル UI
	index.tsx	ポーリング & キー操作
	bin/ccradar.js	#!/usr/bin/env node

Vitest + ink-testing-library でユニットテストを作成。

⸻

開発ワークフロー
	1.	GitHub で Issue 起票 → implement ラベル付与
	2.	ローカルで

pnpm dev        # ccradar TUI 起動


	3.	ccradar が検知 → claude -p 発火 → PR 自動生成
	4.	PR 緑なら Auto-Merge（GitHub Actions）

⸻

CI / CD 設計

Job	内容
lint-test	pnpm install → pnpm lint && pnpm test
auto-merge	PR green & approved → gh pr merge --auto --squash


⸻


