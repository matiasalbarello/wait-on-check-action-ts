import {
  removeIgnoredChecks,
  filterByCheckName,
  filterByCheckRegexp,
  filtersPresent,
  applyAllFilters
} from '../src/filters'
import { CheckRun } from '../src/types'

describe('filters', () => {
  const createCheck = (
    name: string,
    status: CheckRun['status'] = 'completed',
    conclusion: CheckRun['conclusion'] = 'success'
  ): CheckRun => ({
    name,
    status,
    conclusion
  })

  describe('removeIgnoredChecks', () => {
    it('removes checks in the ignore list', () => {
      const checks = [
        createCheck('check1'),
        createCheck('check2'),
        createCheck('check3')
      ]

      const result = removeIgnoredChecks(checks, ['check2'], '')
      expect(result.map((c) => c.name)).toEqual(['check1', 'check3'])
    })

    it('removes check matching workflow name', () => {
      const checks = [createCheck('my-workflow'), createCheck('other-check')]

      const result = removeIgnoredChecks(checks, [], 'my-workflow')
      expect(result.map((c) => c.name)).toEqual(['other-check'])
    })

    it('removes checks from both ignore list and workflow name', () => {
      const checks = [
        createCheck('check1'),
        createCheck('check2'),
        createCheck('workflow')
      ]

      const result = removeIgnoredChecks(checks, ['check1'], 'workflow')
      expect(result.map((c) => c.name)).toEqual(['check2'])
    })

    it('returns all checks when ignore list is empty', () => {
      const checks = [createCheck('check1'), createCheck('check2')]

      const result = removeIgnoredChecks(checks, [], '')
      expect(result).toHaveLength(2)
    })
  })

  describe('filterByCheckName', () => {
    it('returns only checks matching the exact name', () => {
      const checks = [createCheck('target-check'), createCheck('other-check')]

      const result = filterByCheckName(checks, 'target-check')
      expect(result.map((c) => c.name)).toEqual(['target-check'])
    })

    it('returns empty array if no match', () => {
      const checks = [createCheck('check1'), createCheck('check2')]

      const result = filterByCheckName(checks, 'nonexistent')
      expect(result).toHaveLength(0)
    })

    it('returns all checks if checkName is empty', () => {
      const checks = [createCheck('check1'), createCheck('check2')]

      const result = filterByCheckName(checks, '')
      expect(result).toHaveLength(2)
    })

    it('returns all checks if checkName is whitespace', () => {
      const checks = [createCheck('check1'), createCheck('check2')]

      const result = filterByCheckName(checks, '   ')
      expect(result).toHaveLength(2)
    })
  })

  describe('filterByCheckRegexp', () => {
    it('filters checks by simple regexp', () => {
      const checks = [
        createCheck('test-unit'),
        createCheck('test-integration'),
        createCheck('build')
      ]

      const result = filterByCheckRegexp(checks, '^test-')
      expect(result.map((c) => c.name)).toEqual([
        'test-unit',
        'test-integration'
      ])
    })

    it('filters checks by complex regexp', () => {
      const checks = [
        createCheck('test@example.com'),
        createCheck('other-check')
      ]

      const result = filterByCheckRegexp(checks, '\\w+@\\w+\\.\\w+')
      expect(result.map((c) => c.name)).toEqual(['test@example.com'])
    })

    it('returns empty array if no match', () => {
      const checks = [createCheck('check1'), createCheck('check2')]

      const result = filterByCheckRegexp(checks, 'nonexistent')
      expect(result).toHaveLength(0)
    })

    it('returns all checks if pattern is empty', () => {
      const checks = [createCheck('check1'), createCheck('check2')]

      const result = filterByCheckRegexp(checks, '')
      expect(result).toHaveLength(2)
    })
  })

  describe('filtersPresent', () => {
    it('returns true if checkName is set', () => {
      expect(filtersPresent('my-check', '')).toBe(true)
    })

    it('returns true if checkRegexp is set', () => {
      expect(filtersPresent('', 'test-.*')).toBe(true)
    })

    it('returns true if both are set', () => {
      expect(filtersPresent('my-check', 'test-.*')).toBe(true)
    })

    it('returns false if both are empty', () => {
      expect(filtersPresent('', '')).toBe(false)
    })

    it('returns false if both are whitespace', () => {
      expect(filtersPresent('   ', '   ')).toBe(false)
    })
  })

  describe('applyAllFilters', () => {
    it('applies all filters in sequence', () => {
      const checks = [
        createCheck('test-unit'),
        createCheck('test-integration'),
        createCheck('build'),
        createCheck('workflow'),
        createCheck('ignored-check')
      ]

      const result = applyAllFilters(
        checks,
        ['ignored-check'],
        'workflow',
        '',
        '^test-'
      )
      expect(result.map((c) => c.name)).toEqual([
        'test-unit',
        'test-integration'
      ])
    })

    it('handles empty filters', () => {
      const checks = [createCheck('check1'), createCheck('check2')]

      const result = applyAllFilters(checks, [], '', '', '')
      expect(result).toHaveLength(2)
    })
  })
})
