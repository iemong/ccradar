import { Box, Text, useInput } from 'ink'
import type React from 'react'
import { useState } from 'react'
import type { Issue } from '../types.js'

interface PromptInputProps {
  issue: Issue
  onSubmit: (prompt: string) => void
  onCancel: () => void
}

export const PromptInput: React.FC<PromptInputProps> = ({ issue, onSubmit, onCancel }) => {
  const [input, setInput] = useState('')

  useInput((inputStr, key) => {
    if (key.return) {
      if (input.trim()) {
        onSubmit(input.trim())
      }
    } else if (key.escape) {
      onCancel()
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1))
    } else if (inputStr && !key.ctrl && !key.meta) {
      setInput((prev) => prev + inputStr)
    }
  })

  const defaultPrompt = `GitHub Issue実装タスク:

リポジトリ: ${issue.repo}
Issue番号: #${issue.number}
タイトル: ${issue.title}
URL: ${issue.url}
ラベル: ${issue.labels.join(', ')}

このIssueの内容を確認し、必要な実装を行ってください。
実装完了後は、適切なコミットメッセージでコミットし、PRを作成してください。`

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">
          Issue #{issue.number}: {issue.title}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="yellow">プロンプトを入力してください（Enterで実行、Escapeでキャンセル）:</Text>
      </Box>

      <Box borderStyle="round" paddingX={1} marginBottom={1}>
        <Text>{input || '（デフォルトプロンプトを使用する場合はそのままEnter）'}</Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>現在の入力: {input.length} 文字</Text>
      </Box>

      {!input.trim() && (
        <Box flexDirection="column" marginTop={1}>
          <Text color="gray">デフォルトプロンプト:</Text>
          <Box borderStyle="single" paddingX={1} marginTop={1}>
            <Text color="gray">{defaultPrompt}</Text>
          </Box>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>
          Enter: 実行 | Escape: キャンセル | 空のままEnter: デフォルトプロンプト使用
        </Text>
      </Box>
    </Box>
  )
}
