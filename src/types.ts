/**
 * Parsed and validated action inputs
 */
export interface ActionInputs {
  /** Git ref to check (branch/tag/commit SHA) - required */
  ref: string
  /** GitHub token for API authentication */
  repoToken: string
  /** Specific check name to wait for */
  checkName: string
  /** Regexp pattern to filter checks */
  checkRegexp: string
  /** Current workflow name to exclude from checks */
  runningWorkflowName: string
  /** List of check names to ignore */
  ignoreChecks: string[]
  /** List of allowed conclusions */
  allowedConclusions: string[]
  /** Seconds between API polling requests */
  waitInterval: number
  /** Custom GitHub API endpoint (for GHE support) */
  apiEndpoint: string
  /** Enable detailed logging */
  verbose: boolean
  /** Fail if no checks match the filter */
  failOnNoChecks: boolean
}

/**
 * Check run status from GitHub API
 */
export type CheckStatus = 'queued' | 'in_progress' | 'completed'

/**
 * Check run conclusion from GitHub API
 */
export type CheckConclusion =
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'
  | null

/**
 * Simplified check run data
 */
export interface CheckRun {
  name: string
  status: CheckStatus
  conclusion: CheckConclusion
}

/**
 * Custom error for when no checks match the filter
 */
export class CheckNeverRunError extends Error {
  constructor(
    message = 'The requested check was never run against this ref, exiting...'
  ) {
    super(message)
    this.name = 'CheckNeverRunError'
  }
}

/**
 * Custom error for when check conclusions are not allowed
 */
export class CheckConclusionNotAllowedError extends Error {
  constructor(allowedConclusions: string[]) {
    const message = `The conclusion of one or more checks were not allowed. Allowed conclusions are: ${allowedConclusions.join(', ')}. This can be configured with the 'allowed-conclusions' param.`
    super(message)
    this.name = 'CheckConclusionNotAllowedError'
  }
}
