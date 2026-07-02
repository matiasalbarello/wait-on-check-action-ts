# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-02

### Changed

- Action runtime bumped from `node20` to `node24`. GitHub Actions now emits
  deprecation warnings for Node 20 actions and will force Node 24 by default
  starting June 2nd, 2026. CI workflows updated to Node 24 accordingly.

## [1.1.0] - 2026-04-15

### Added

- `checks-discovery-timeout` parameter (default: 60s) — waits for matching checks
  to register before failing. Prevents false `CheckNeverRunError` when workflows
  start simultaneously and the target hasn't registered its checks yet.

### Fixed

- API pagination: switched from `per_page: 100` (hard cap) to `octokit.paginate`
  so repositories with more than 100 check runs on a ref are handled correctly.

### Changed

- Improved `action.yml` description and added `author` field for Marketplace discoverability.
- README now credits [lewagon/wait-on-check-action](https://github.com/lewagon/wait-on-check-action)
  as the inspiration for this TypeScript rewrite.

## [1.0.0] - 2026-01-14

### Added

- Initial TypeScript implementation
- `ref` parameter (required) - Git ref to check
- `repo-token` parameter - GitHub token for API authentication
- `check-name` parameter - Wait for specific check by name
- `check-regexp` parameter - Filter checks using regular expression
- `running-workflow-name` parameter - Exclude current workflow from checks
- `ignore-checks` parameter - Comma-separated list of checks to ignore
- `allowed-conclusions` parameter - Allowed check conclusions (default: success,skipped)
- `wait-interval` parameter - Polling interval in seconds (default: 10)
- `api-endpoint` parameter - Custom GitHub API endpoint for GHE support
- `verbose` parameter - Enable detailed logging (default: true)
- `fail-on-no-checks` parameter - Fail when no checks match filter (default: true)
- Jest unit tests
- ESLint and Prettier configuration
- GitHub Actions integration test workflows
