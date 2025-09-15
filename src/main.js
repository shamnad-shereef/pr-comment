import * as core from '@actions/core'
import * as github from '@actions/github'

export async function run() {
  try {
    const owner = core.getInput('owner') || github.context.repo.owner
    const repo = core.getInput('repo') || github.context.repo.repo
    const pr_number = core.getInput('pr_number') || github.context.issue.number
    const token = core.getInput('token') || core.getInput('github-token')

    const octokit = new github.getOctokit(token)

    const { data: changedFiles } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr_number
    })

    let diffData = {
      additions: 0,
      deletions: 0,
      changes: 0
    }

    diffData = changedFiles.reduce((acc, file) => {
      acc.additions += file.additions
      acc.deletions += file.deletions
      acc.changes += file.changes
      return acc
    }, diffData)

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
        Pull request #${pr_number} has be updated with: \n
        - ${diffData.changes} changes \n
        - ${diffData.additions} additions \n
        - ${diffData.deletions} deletions
      `
    })

    for (const file of changedFiles) {
      const fileExtension = file.filename.split('.').pop()
      let label = ''
      switch (fileExtension) {
        case 'md':
          label = 'markdown'
          break
        case 'js':
          label = 'javascript'
          break
        case 'yml':
          label = 'yaml'
          break
        case 'yaml':
          label = 'yaml'
          break
        default:
          label = 'noextension'
      }
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: pr_number,
        labels: [label]
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
