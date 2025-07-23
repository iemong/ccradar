import { Octokit } from '@octokit/rest'
import { config as dotenvConfig } from 'dotenv'

dotenvConfig()

const token = process.env.GITHUB_TOKEN
console.log('Token prefix:', `${token?.substring(0, 10)}...`)
console.log('Token length:', token?.length)

const octokit = new Octokit({
  auth: token,
})

try {
  console.log('Testing GitHub API with Octokit...')
  const { data } = await octokit.users.getAuthenticated()
  console.log('Success! Authenticated as:', data.login)
  console.log('Account type:', data.type)
  console.log('Plan:', data.plan?.name)
} catch (error) {
  console.error('GitHub API Error:')
  console.error('Status:', error.status)
  console.error('Message:', error.message)
  console.error('Response:', error.response?.data)

  if (error.status === 401) {
    console.log('\n考えられる原因:')
    console.log('1. トークンが期限切れまたは削除されている')
    console.log('2. トークンに必要なスコープ（user, repo）が設定されていない')
    console.log('3. GitHubアカウントで2FAが有効で追加の認証が必要')
    console.log('4. トークンが正しくコピーされていない')
  }
}
