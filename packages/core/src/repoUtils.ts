import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export interface RepoInfo {
  owner: string
  name: string
  fullName: string
}

export async function getCurrentRepoInfo(cwd: string = process.cwd()): Promise<RepoInfo | null> {
  // .gitディレクトリが存在するかチェック
  if (!existsSync(join(cwd, '.git'))) {
    return null
  }

  try {
    // GitHub CLIを使用してリポジトリ情報を取得
    const repoOutput = execSync('gh repo view --json owner,name', {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    })

    const repoData = JSON.parse(repoOutput)
    return {
      owner: repoData.owner.login,
      name: repoData.name,
      fullName: `${repoData.owner.login}/${repoData.name}`,
    }
  } catch (_error) {
    // GitHub CLIが失敗した場合はgit remoteから取得を試行
    try {
      const remoteUrl = execSync('git remote get-url origin', {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      }).trim()

      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
      if (match) {
        const [, owner, name] = match
        return {
          owner,
          name,
          fullName: `${owner}/${name}`,
        }
      }
    } catch (_gitError) {
      // git remoteも失敗した場合
    }

    return null
  }
}

export async function checkGitHubCLI(): Promise<boolean> {
  try {
    execSync('gh --version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export async function checkGitHubAuth(): Promise<boolean> {
  try {
    // gh auth statusは成功時でもstderrに情報を出力するため、
    // 終了コードのみで判定する
    execSync('gh auth status', {
      stdio: 'ignore', // 全ての出力を無視
    })
    return true
  } catch (_error) {
    // 終了コードが0でない場合は認証されていない
    return false
  }
}
