import * as core from '@actions/core'
import { parseInputs } from '../src/inputs'

// Mock @actions/core
jest.mock('@actions/core')

const mockedCore = core as jest.Mocked<typeof core>

describe('parseInputs', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const setupMocks = (inputs: Record<string, string>): void => {
    mockedCore.getInput.mockImplementation((name: string) => {
      return inputs[name] || ''
    })
  }

  it('parses required ref input', () => {
    setupMocks({ ref: 'main' })

    const result = parseInputs()
    expect(result.ref).toBe('main')
  })

  it('parses comma-separated ignore-checks', () => {
    setupMocks({
      ref: 'main',
      'ignore-checks': 'check1, check2, check3'
    })

    const result = parseInputs()
    expect(result.ignoreChecks).toEqual(['check1', 'check2', 'check3'])
  })

  it('parses comma-separated allowed-conclusions', () => {
    setupMocks({
      ref: 'main',
      'allowed-conclusions': 'success, skipped, cancelled'
    })

    const result = parseInputs()
    expect(result.allowedConclusions).toEqual([
      'success',
      'skipped',
      'cancelled'
    ])
  })

  it('uses default allowed-conclusions when empty', () => {
    setupMocks({ ref: 'main' })

    const result = parseInputs()
    expect(result.allowedConclusions).toEqual(['success', 'skipped'])
  })

  it('parses wait-interval as number', () => {
    setupMocks({
      ref: 'main',
      'wait-interval': '30'
    })

    const result = parseInputs()
    expect(result.waitInterval).toBe(30)
  })

  it('uses default wait-interval when invalid', () => {
    setupMocks({
      ref: 'main',
      'wait-interval': 'invalid'
    })

    const result = parseInputs()
    expect(result.waitInterval).toBe(10)
  })

  it('parses verbose as boolean true', () => {
    setupMocks({
      ref: 'main',
      verbose: 'true'
    })

    const result = parseInputs()
    expect(result.verbose).toBe(true)
  })

  it('parses verbose as boolean false', () => {
    setupMocks({
      ref: 'main',
      verbose: 'false'
    })

    const result = parseInputs()
    expect(result.verbose).toBe(false)
  })

  it('defaults verbose to true when empty', () => {
    setupMocks({ ref: 'main' })

    const result = parseInputs()
    expect(result.verbose).toBe(true)
  })

  it('parses fail-on-no-checks as boolean true', () => {
    setupMocks({
      ref: 'main',
      'fail-on-no-checks': 'true'
    })

    const result = parseInputs()
    expect(result.failOnNoChecks).toBe(true)
  })

  it('parses fail-on-no-checks as boolean false', () => {
    setupMocks({
      ref: 'main',
      'fail-on-no-checks': 'false'
    })

    const result = parseInputs()
    expect(result.failOnNoChecks).toBe(false)
  })

  it('defaults fail-on-no-checks to true when empty', () => {
    setupMocks({ ref: 'main' })

    const result = parseInputs()
    expect(result.failOnNoChecks).toBe(true)
  })

  it('handles empty ignore-checks', () => {
    setupMocks({ ref: 'main', 'ignore-checks': '' })

    const result = parseInputs()
    expect(result.ignoreChecks).toEqual([])
  })

  it('handles whitespace-only values', () => {
    setupMocks({ ref: 'main', 'ignore-checks': '   ' })

    const result = parseInputs()
    expect(result.ignoreChecks).toEqual([])
  })

  it('parses all inputs correctly', () => {
    setupMocks({
      ref: 'abc123',
      'repo-token': 'ghp_token',
      'check-name': 'my-check',
      'check-regexp': 'test-.*',
      'running-workflow-name': 'my-workflow',
      'ignore-checks': 'lint, format',
      'allowed-conclusions': 'success',
      'wait-interval': '15',
      'api-endpoint': 'https://ghe.example.com/api/v3',
      verbose: 'false',
      'fail-on-no-checks': 'false'
    })

    const result = parseInputs()

    expect(result).toEqual({
      ref: 'abc123',
      repoToken: 'ghp_token',
      checkName: 'my-check',
      checkRegexp: 'test-.*',
      runningWorkflowName: 'my-workflow',
      ignoreChecks: ['lint', 'format'],
      allowedConclusions: ['success'],
      waitInterval: 15,
      apiEndpoint: 'https://ghe.example.com/api/v3',
      verbose: false,
      failOnNoChecks: false
    })
  })
})
