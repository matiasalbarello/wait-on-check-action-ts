import { GitHub } from '@actions/github/lib/utils'
import {
  ActionInputs,
  CheckRun,
  CheckNeverRunError,
  CheckConclusionNotAllowedError
} from './types'
import { applyAllFilters, filtersPresent } from './filters'
import { Logger } from './logger'

type OctokitClient = InstanceType<typeof GitHub>

/**
 * Sleep for the specified number of seconds
 */
function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

/**
 * Query check runs for a ref from GitHub API
 */
async function queryCheckRuns(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  ref: string
): Promise<CheckRun[]> {
  const response = await octokit.rest.checks.listForRef({
    owner,
    repo,
    ref,
    per_page: 100
  })

  return response.data.check_runs.map((run) => ({
    name: run.name,
    status: run.status as CheckRun['status'],
    conclusion: run.conclusion as CheckRun['conclusion']
  }))
}

/**
 * Check if all checks have completed
 */
function allChecksComplete(checks: CheckRun[]): boolean {
  return checks.every((check) => check.status === 'completed')
}

/**
 * Validate that all check conclusions are allowed
 */
function validateConclusions(
  checks: CheckRun[],
  allowedConclusions: string[]
): void {
  const allAllowed = checks.every(
    (check) => check.conclusion && allowedConclusions.includes(check.conclusion)
  )

  if (!allAllowed) {
    throw new CheckConclusionNotAllowedError(allowedConclusions)
  }
}

/**
 * Main wait loop for checks to complete
 */
export async function waitForChecks(
  octokit: OctokitClient,
  inputs: ActionInputs
): Promise<void> {
  const logger = new Logger(inputs.verbose)

  // Parse owner/repo from GITHUB_REPOSITORY env var
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/')

  if (!owner || !repo) {
    throw new Error(
      'GITHUB_REPOSITORY environment variable is not set correctly'
    )
  }

  // Query and filter checks
  const queryAndFilter = async (): Promise<CheckRun[]> => {
    const allChecks = await queryCheckRuns(octokit, owner, repo, inputs.ref)
    logger.logChecks(allChecks, 'Checks running on ref:')

    const filtered = applyAllFilters(
      allChecks,
      inputs.ignoreChecks,
      inputs.runningWorkflowName,
      inputs.checkName,
      inputs.checkRegexp
    )
    logger.logChecks(filtered, 'Checks after filtering:')

    return filtered
  }

  // Initial query
  let checks = await queryAndFilter()

  // Check if no checks match the filter
  if (
    filtersPresent(inputs.checkName, inputs.checkRegexp) &&
    checks.length === 0
  ) {
    if (!inputs.failOnNoChecks) {
      logger.logNoChecksSuccess()
      return
    }
    throw new CheckNeverRunError()
  }

  // Poll until all checks complete
  while (!allChecksComplete(checks)) {
    logger.logWaiting(checks.length, inputs.waitInterval)
    await sleep(inputs.waitInterval)
    checks = await queryAndFilter()
  }

  // Log final conclusions
  logger.logConclusions(checks)

  // Validate conclusions
  validateConclusions(checks, inputs.allowedConclusions)
}
