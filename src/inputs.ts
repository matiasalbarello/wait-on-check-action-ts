import * as core from '@actions/core'
import { ActionInputs } from './types'

/**
 * Parse a comma-separated string into an array of trimmed strings
 */
function parseCommaSeparated(value: string): string[] {
  if (!value || value.trim() === '') {
    return []
  }
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '')
}

/**
 * Parse and validate action inputs from the workflow
 */
export function parseInputs(): ActionInputs {
  const ref = core.getInput('ref', { required: true })
  const repoToken = core.getInput('repo-token')
  const checkName = core.getInput('check-name')
  const checkRegexp = core.getInput('check-regexp')
  const runningWorkflowName = core.getInput('running-workflow-name')
  const ignoreChecksRaw = core.getInput('ignore-checks')
  const allowedConclusionsRaw = core.getInput('allowed-conclusions')
  const waitIntervalRaw = core.getInput('wait-interval')
  const apiEndpoint = core.getInput('api-endpoint')
  const verboseRaw = core.getInput('verbose')
  const failOnNoChecksRaw = core.getInput('fail-on-no-checks')

  // Parse comma-separated values
  const ignoreChecks = parseCommaSeparated(ignoreChecksRaw)
  const allowedConclusions = parseCommaSeparated(allowedConclusionsRaw)

  // Set defaults if empty
  const finalAllowedConclusions =
    allowedConclusions.length > 0 ? allowedConclusions : ['success', 'skipped']

  // Parse numeric values
  const waitInterval = parseInt(waitIntervalRaw, 10) || 10

  // Parse boolean values (default verbose to true, failOnNoChecks to true)
  const verbose = verboseRaw === '' ? true : verboseRaw.toLowerCase() === 'true'
  const failOnNoChecks =
    failOnNoChecksRaw === '' ? true : failOnNoChecksRaw.toLowerCase() === 'true'

  return {
    ref,
    repoToken,
    checkName,
    checkRegexp,
    runningWorkflowName,
    ignoreChecks,
    allowedConclusions: finalAllowedConclusions,
    waitInterval,
    apiEndpoint,
    verbose,
    failOnNoChecks
  }
}
