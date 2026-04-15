import { waitForChecks } from '../src/wait'
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

// --- helpers ---

const makeInputs = (overrides: Partial<ActionInputs> = {}): ActionInputs => ({
  ref: 'abc123',
  repoToken: 'token',
  checkName: '',
  checkRegexp: '',
  runningWorkflowName: '',
  ignoreChecks: [],
  allowedConclusions: ['success'],
  waitInterval: 0.001, // 1 ms — keeps tests fast
  apiEndpoint: '',
  verbose: false,
  failOnNoChecks: true,
  checksDiscoveryTimeout: -1, // negative = discovery loop never runs
  ...overrides
})

/** Build a minimal mock Octokit whose paginate returns the given runs */
const makeOctokit = (paginate: jest.Mock) => {
  const listForRef = jest.fn()
  return { paginate, rest: { checks: { listForRef } } }
}

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

describe('waitForChecks', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV, GITHUB_REPOSITORY: 'owner/repo' }
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('calls octokit.paginate — not listForRef directly — to support >100 checks', async () => {
    const paginate = jest
      .fn()
      .mockResolvedValue([
        { name: 'build', status: 'completed', conclusion: 'success' }
      ])
    const octokit = makeOctokit(paginate)

    await waitForChecks(octokit as any, makeInputs())

    // paginate must be called with listForRef as the endpoint
    expect(paginate).toHaveBeenCalledWith(
      octokit.rest.checks.listForRef,
      expect.objectContaining({
        owner: 'owner',
        repo: 'repo',
        ref: 'abc123',
        per_page: 100
      })
    )
    // listForRef must NOT have been called directly
    expect(octokit.rest.checks.listForRef).not.toHaveBeenCalled()
  })

  it('polls until all checks are complete', async () => {
    const paginate = jest
      .fn()
      .mockResolvedValueOnce([
        { name: 'build', status: 'in_progress', conclusion: null }
      ])
      .mockResolvedValue([
        { name: 'build', status: 'completed', conclusion: 'success' }
      ])

    await waitForChecks(makeOctokit(paginate) as any, makeInputs())

    expect(paginate).toHaveBeenCalledTimes(2)
  })

  it('retries during discovery timeout until matching checks appear', async () => {
    const paginate = jest
      .fn()
      .mockResolvedValueOnce([]) // first query: target workflow hasn't registered yet
      .mockResolvedValue([
        { name: 'build', status: 'completed', conclusion: 'success' }
      ])

    await waitForChecks(
      makeOctokit(paginate) as any,
      makeInputs({ checkName: 'build', checksDiscoveryTimeout: 10 })
    )

    // Should have queried twice: once on startup (empty), once in discovery loop
    expect(paginate).toHaveBeenCalledTimes(2)
  })

  it('throws CheckNeverRunError after discovery timeout expires', async () => {
    const paginate = jest.fn().mockResolvedValue([])

    await expect(
      waitForChecks(
        makeOctokit(paginate) as any,
        makeInputs({ checkName: 'missing-check' }) // checksDiscoveryTimeout: -1 → loop never runs
      )
    ).rejects.toThrow(CheckNeverRunError)
  })

  it('throws CheckConclusionNotAllowedError when conclusion is disallowed', async () => {
    const paginate = jest
      .fn()
      .mockResolvedValue([
        { name: 'build', status: 'completed', conclusion: 'failure' }
      ])

    await expect(
      waitForChecks(
        makeOctokit(paginate) as any,
        makeInputs({ allowedConclusions: ['success'] })
      )
    ).rejects.toThrow(CheckConclusionNotAllowedError)
  })

  it('resolves without error when fail-on-no-checks is false and no checks match', async () => {
    const paginate = jest.fn().mockResolvedValue([])

    await expect(
      waitForChecks(
        makeOctokit(paginate) as any,
        makeInputs({ checkName: 'missing', failOnNoChecks: false })
      )
    ).resolves.toBeUndefined()
  })

  it('throws when GITHUB_REPOSITORY is not set', async () => {
    delete process.env.GITHUB_REPOSITORY
    const paginate = jest.fn()

    await expect(
      waitForChecks(makeOctokit(paginate) as any, makeInputs())
    ).rejects.toThrow('GITHUB_REPOSITORY')
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
      failOnNoChecks: true,
      checksDiscoveryTimeout: 60
    }

    expect(inputs.ref).toBe('main')
    expect(inputs.allowedConclusions).toContain('success')
    expect(inputs.waitInterval).toBe(10)
    expect(inputs.verbose).toBe(true)
    expect(inputs.failOnNoChecks).toBe(true)
  })
})
