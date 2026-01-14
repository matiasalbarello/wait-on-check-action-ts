import * as core from '@actions/core'
import { CheckRun } from './types'

/**
 * Logger that respects the verbose flag
 */
export class Logger {
  constructor(private verbose: boolean) {}

  /**
   * Log a message (only if verbose is true)
   */
  info(message: string): void {
    if (this.verbose) {
      core.info(message)
    }
  }

  /**
   * Log checks grouped by status
   */
  logChecks(checks: CheckRun[], header: string): void {
    if (!this.verbose) {
      return
    }

    core.info(header)

    const statuses = [...new Set(checks.map((c) => c.status))]
    for (const status of statuses) {
      const checksWithStatus = checks.filter((c) => c.status === status)
      const names = checksWithStatus.map((c) => c.name).join(', ')
      core.info(`Checks ${status}: ${names}`)
    }
  }

  /**
   * Log that we're waiting for checks
   */
  logWaiting(checkCount: number, waitInterval: number): void {
    if (!this.verbose) {
      return
    }

    const pluralPart = checkCount > 1 ? "checks aren't" : "check isn't"
    core.info(
      `The requested ${pluralPart} complete yet, will check back in ${waitInterval} seconds...`
    )
  }

  /**
   * Log check conclusions
   */
  logConclusions(checks: CheckRun[]): void {
    if (!this.verbose) {
      return
    }

    core.info('Checks completed:')
    for (const check of checks) {
      core.info(`${check.name}: ${check.status} (${check.conclusion})`)
    }
  }

  /**
   * Log success message when no checks match but fail-on-no-checks is false
   */
  logNoChecksSuccess(): void {
    core.info(
      'No checks found matching the filter, but fail-on-no-checks is false. Succeeding...'
    )
  }
}
