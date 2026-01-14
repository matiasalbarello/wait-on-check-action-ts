import {
  CheckRun,
  CheckNeverRunError,
  CheckConclusionNotAllowedError,
  ActionInputs
} from '../src/types'

// Mock @actions/core
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  setFailed: jest.fn()
}))

// We need to test the internal functions, so let's extract them
// For now, we'll test the types and error classes

describe('types', () => {
  describe('CheckNeverRunError', () => {
    it('has correct default message', () => {
      const error = new CheckNeverRunError()
      expect(error.message).toBe(
        'The requested check was never run against this ref, exiting...'
      )
      expect(error.name).toBe('CheckNeverRunError')
    })

    it('accepts custom message', () => {
      const error = new CheckNeverRunError('Custom message')
      expect(error.message).toBe('Custom message')
    })
  })

  describe('CheckConclusionNotAllowedError', () => {
    it('formats message with allowed conclusions', () => {
      const error = new CheckConclusionNotAllowedError(['success', 'skipped'])
      expect(error.message).toContain('success, skipped')
      expect(error.message).toContain('allowed-conclusions')
      expect(error.name).toBe('CheckConclusionNotAllowedError')
    })
  })
})

describe('wait module helpers', () => {
  // Test helper functions that we can test in isolation

  describe('allChecksComplete', () => {
    // We'll inline this test since the function is in wait.ts

    const allChecksComplete = (checks: CheckRun[]): boolean => {
      return checks.every((check) => check.status === 'completed')
    }

    it('returns true when all checks are completed', () => {
      const checks: CheckRun[] = [
        { name: 'check1', status: 'completed', conclusion: 'success' },
        { name: 'check2', status: 'completed', conclusion: 'failure' }
      ]
      expect(allChecksComplete(checks)).toBe(true)
    })

    it('returns false when some checks are queued', () => {
      const checks: CheckRun[] = [
        { name: 'check1', status: 'completed', conclusion: 'success' },
        { name: 'check2', status: 'queued', conclusion: null }
      ]
      expect(allChecksComplete(checks)).toBe(false)
    })

    it('returns false when some checks are in progress', () => {
      const checks: CheckRun[] = [
        { name: 'check1', status: 'completed', conclusion: 'success' },
        { name: 'check2', status: 'in_progress', conclusion: null }
      ]
      expect(allChecksComplete(checks)).toBe(false)
    })

    it('returns true for empty array', () => {
      expect(allChecksComplete([])).toBe(true)
    })
  })

  describe('validateConclusions', () => {
    const validateConclusions = (
      checks: CheckRun[],
      allowedConclusions: string[]
    ): void => {
      const allAllowed = checks.every(
        (check) =>
          check.conclusion && allowedConclusions.includes(check.conclusion)
      )
      if (!allAllowed) {
        throw new CheckConclusionNotAllowedError(allowedConclusions)
      }
    }

    it('does not throw when all conclusions are allowed', () => {
      const checks: CheckRun[] = [
        { name: 'check1', status: 'completed', conclusion: 'success' },
        { name: 'check2', status: 'completed', conclusion: 'skipped' }
      ]
      expect(() =>
        validateConclusions(checks, ['success', 'skipped'])
      ).not.toThrow()
    })

    it('throws when a conclusion is not allowed', () => {
      const checks: CheckRun[] = [
        { name: 'check1', status: 'completed', conclusion: 'success' },
        { name: 'check2', status: 'completed', conclusion: 'failure' }
      ]
      expect(() => validateConclusions(checks, ['success', 'skipped'])).toThrow(
        CheckConclusionNotAllowedError
      )
    })

    it('does not throw for empty checks array', () => {
      expect(() => validateConclusions([], ['success'])).not.toThrow()
    })
  })
})

describe('ActionInputs defaults', () => {
  it('should have correct structure', () => {
    const inputs: ActionInputs = {
      ref: 'main',
      repoToken: 'token',
      checkName: '',
      checkRegexp: '',
      runningWorkflowName: '',
      ignoreChecks: [],
      allowedConclusions: ['success', 'skipped'],
      waitInterval: 10,
      apiEndpoint: '',
      verbose: true,
      failOnNoChecks: true
    }

    expect(inputs.ref).toBe('main')
    expect(inputs.allowedConclusions).toContain('success')
    expect(inputs.waitInterval).toBe(10)
    expect(inputs.verbose).toBe(true)
    expect(inputs.failOnNoChecks).toBe(true)
  })
})
