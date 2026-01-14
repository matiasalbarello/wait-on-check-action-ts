import * as core from '@actions/core'
import * as github from '@actions/github'
import { parseInputs } from './inputs'
import { waitForChecks } from './wait'
import { CheckNeverRunError, CheckConclusionNotAllowedError } from './types'

async function run(): Promise<void> {
  try {
    const inputs = parseInputs()

    // Create Octokit client with optional custom endpoint for GHE
    const octokitOptions: { baseUrl?: string } = {}
    if (inputs.apiEndpoint && inputs.apiEndpoint.trim() !== '') {
      octokitOptions.baseUrl = inputs.apiEndpoint
    }

    const octokit = github.getOctokit(inputs.repoToken, octokitOptions)

    await waitForChecks(octokit, inputs)

    core.info('All checks passed!')
  } catch (error) {
    if (
      error instanceof CheckNeverRunError ||
      error instanceof CheckConclusionNotAllowedError
    ) {
      core.setFailed(error.message)
    } else if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}

run()
