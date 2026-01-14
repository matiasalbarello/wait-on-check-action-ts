import { CheckRun } from './types'

/**
 * Remove checks that are in the ignore list or match the running workflow name
 */
export function removeIgnoredChecks(
  checks: CheckRun[],
  ignoreList: string[],
  workflowName: string
): CheckRun[] {
  const toIgnore = new Set(
    [...ignoreList, workflowName].filter((s) => s !== '')
  )
  return checks.filter((check) => !toIgnore.has(check.name))
}

/**
 * Filter checks to only include those matching the exact check name
 */
export function filterByCheckName(
  checks: CheckRun[],
  checkName: string
): CheckRun[] {
  if (!checkName || checkName.trim() === '') {
    return checks
  }
  return checks.filter((check) => check.name === checkName)
}

/**
 * Filter checks to only include those matching the regexp pattern
 */
export function filterByCheckRegexp(
  checks: CheckRun[],
  pattern: string
): CheckRun[] {
  if (!pattern || pattern.trim() === '') {
    return checks
  }
  const regexp = new RegExp(pattern)
  return checks.filter((check) => regexp.test(check.name))
}

/**
 * Check if any filters are present (check-name or check-regexp)
 */
export function filtersPresent(
  checkName: string,
  checkRegexp: string
): boolean {
  return (
    (checkName !== '' && checkName.trim() !== '') ||
    (checkRegexp !== '' && checkRegexp.trim() !== '')
  )
}

/**
 * Apply all filters in sequence
 */
export function applyAllFilters(
  checks: CheckRun[],
  ignoreChecks: string[],
  runningWorkflowName: string,
  checkName: string,
  checkRegexp: string
): CheckRun[] {
  let filtered = removeIgnoredChecks(checks, ignoreChecks, runningWorkflowName)
  filtered = filterByCheckName(filtered, checkName)
  filtered = filterByCheckRegexp(filtered, checkRegexp)
  return filtered
}
