# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - Unreleased

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
