#!/bin/bash

# Claude Code をSandbox環境で実行するスクリプト
# 使用方法: ./run-claude-sandbox.sh [claude-codeの引数]

PROJECT_DIR="$(pwd)"
HOME_DIR="$HOME"
SANDBOX_CONFIG="$(pwd)/claude-sandbox.sb"

# Claude Codeのパスを確認
CLAUDE_PATH="$HOME/.claude/local/claude"

if [ ! -f "$CLAUDE_PATH" ]; then
    echo "エラー: Claude Code が見つかりません ($CLAUDE_PATH)"
    echo "Claude Code をインストールしてください"
    exit 1
fi

if [ ! -f "$SANDBOX_CONFIG" ]; then
    echo "エラー: Sandbox設定ファイルが見つかりません ($SANDBOX_CONFIG)"
    exit 1
fi

echo "Sandbox環境でClaude Codeを起動中..."
echo "プロジェクトディレクトリ: $PROJECT_DIR"
echo "Sandbox設定: $SANDBOX_CONFIG"
echo

# Sandbox環境でClaude Codeを実行
exec sandbox-exec \
    -f "$SANDBOX_CONFIG" \
    -D TARGET_DIR="$PROJECT_DIR" \
    -D HOME_DIR="$HOME_DIR" \
    "$CLAUDE_PATH" "$@"