# ccradar Sandbox セキュリティ使用ガイド

## 概要
ccradarが自動実行するClaude CLIにmacOS Sandbox環境を適用し、セキュリティを強化する機能です。

## 有効化方法

### 環境変数設定
```bash
# Sandbox機能を有効化
export CCRADAR_USE_SANDBOX=true

# カスタムSandbox設定ファイル（オプション）
export CCRADAR_SANDBOX_CONFIG=/path/to/custom/sandbox.sb

# 他の設定
export GITHUB_TOKEN="your_token"
export GITHUB_REPOS="user/repo1,user/repo2"
```

### 使用例
```bash
# Sandbox有効でccradar実行
CCRADAR_USE_SANDBOX=true pnpm dev

# カスタム設定でSandbox実行
CCRADAR_USE_SANDBOX=true CCRADAR_SANDBOX_CONFIG=/custom/sandbox.sb pnpm dev
```

## セキュリティ制限

### 書き込み許可
- ✅ 作業ディレクトリ（WORK_DIR）
- ✅ ~/.claude/ ディレクトリ
- ✅ ~/.gitconfig, ~/.ssh/
- ✅ 一時ディレクトリ

### 書き込み禁止
- ❌ システムファイル
- ❌ 他のプロジェクトディレクトリ
- ❌ /usr/, /System/, /Applications/

### ネットワーク・プロセス
- ✅ GitHub API、Git操作
- ✅ Node.js、npm、pnpm実行
- ✅ SSH、GitHub CLI実行

## ファイル構成

### Sandbox設定ファイル
- `claude-ccradar.sb` - ccradar専用Sandbox設定
- `claude-sandbox.sb` - 手動Claude実行用設定
- `run-claude-sandbox.sh` - 手動実行スクリプト

### プログラム変更
- `ClaudeInvoker` - Sandbox実行サポート追加
- `Config` - 環境変数からSandbox設定読み込み
- テスト - 包括的Sandboxテストカバレッジ

## トラブルシューティング

### Sandbox無効化
```bash
# 一時的にSandbox無効化
CCRADAR_USE_SANDBOX=false pnpm dev

# または環境変数削除
unset CCRADAR_USE_SANDBOX
```

### 権限エラー
- Sandbox設定ファイルの権限を確認
- 作業ディレクトリのパス確認
- `sandbox-exec`コマンドの利用可能性確認

## セキュリティ効果

1. **意図しないファイル変更防止**
   - プロジェクト外への書き込み制限
   - システム設定変更防止

2. **リスク軽減**
   - AIの「うっかりミス」対策
   - マルウェア的動作の防止

3. **監査性向上**
   - 制限された環境での実行記録
   - セキュリティポリシーの明文化

## 注意事項

- `sandbox-exec`は非推奨ですが動作します
- MCP（Chrome）操作には制限があります
- 必要に応じて通常モードに切り替え可能