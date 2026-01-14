# Wait On Check Action

Pause a workflow until a job in another workflow completes successfully.

This action uses the [Checks API](https://docs.github.com/en/rest/checks) to poll for check results. On success, the action exits allowing the workflow to resume. Otherwise, the action will exit with status code 1 and fail the whole workflow.

This is a workaround to GitHub's limitation of non-interdependent workflows.

You can **run your workflows in parallel** and pause a job until a job in another workflow completes successfully.

## Minimal Example

```yml
name: Test

on: [push]

jobs:
  test:
    name: Run tests
    runs-on: ubuntu-latest
    steps: ...
```

```yml
name: Publish

on: [push]

jobs:
  publish:
    name: Publish the package
    runs-on: ubuntu-latest
    steps:
      - name: Wait for tests to succeed
        uses: matiasalbarello/wait-on-check-action@v1.0.0
        with:
          ref: ${{ github.ref }}
          check-name: 'Run tests'
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          wait-interval: 10
      ...
```

## Parameters

### Required

| Parameter | Description                                    |
| --------- | ---------------------------------------------- |
| `ref`     | A git ref to be checked: branch/tag/commit sha |

### Optional

| Parameter               | Default           | Description                                                         |
| ----------------------- | ----------------- | ------------------------------------------------------------------- |
| `repo-token`            | `""`              | A GitHub token for the repo (usually `${{ secrets.GITHUB_TOKEN }}`) |
| `check-name`            | `""`              | A specific check name to wait for                                   |
| `check-regexp`          | `""`              | Filter checks to wait using Regexp                                  |
| `running-workflow-name` | `""`              | Name of the current workflow to exclude from checks                 |
| `ignore-checks`         | `""`              | Comma-separated list of check names to ignore                       |
| `allowed-conclusions`   | `success,skipped` | Comma-separated list of allowed conclusions                         |
| `wait-interval`         | `10`              | Seconds to wait between API polling requests                        |
| `api-endpoint`          | `""`              | Custom GitHub API endpoint (for GHE)                                |
| `verbose`               | `true`            | Enable detailed logging                                             |
| `fail-on-no-checks`     | `true`            | Fail if no checks match the filter                                  |

## Usage Examples

### Wait for a specific check

```yml
- name: Wait for tests
  uses: matiasalbarello/wait-on-check-action@v1.0.0
  with:
    ref: ${{ github.sha }}
    check-name: 'Run tests'
    repo-token: ${{ secrets.GITHUB_TOKEN }}
```

### Wait using regexp filter

```yml
- name: Wait for all test checks
  uses: matiasalbarello/wait-on-check-action@v1.0.0
  with:
    ref: ${{ github.sha }}
    check-regexp: '^test-.*'
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    running-workflow-name: 'my-workflow'
```

### Wait for all checks (except current workflow)

```yml
- name: Wait for all checks
  uses: matiasalbarello/wait-on-check-action@v1.0.0
  with:
    ref: ${{ github.sha }}
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    running-workflow-name: 'my-workflow'
```

### Allow cancelled checks

```yml
- name: Wait for tests
  uses: matiasalbarello/wait-on-check-action@v1.0.0
  with:
    ref: ${{ github.sha }}
    check-name: 'Run tests'
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    allowed-conclusions: success,skipped,cancelled
```

### Succeed when no checks match (conditional workflows)

```yml
- name: Wait for optional tests
  uses: matiasalbarello/wait-on-check-action@v1.0.0
  with:
    ref: ${{ github.sha }}
    check-regexp: 'optional-.*'
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    fail-on-no-checks: false
```

### GitHub Enterprise

```yml
- name: Wait for tests
  uses: matiasalbarello/wait-on-check-action@v1.0.0
  with:
    ref: ${{ github.sha }}
    check-name: 'Run tests'
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    api-endpoint: https://ghe.example.com/api/v3
```

## Check Name Reference

The check name corresponds to the `jobs.<job_id>.name` parameter in your workflow.

```yml
# Check name: "test"
jobs:
  test:
    runs-on: ubuntu-latest
    steps: ...
```

```yml
# Check name: "Run tests"
jobs:
  test:
    name: Run tests
    runs-on: ubuntu-latest
    steps: ...
```

```yml
# Check names: "Run tests (3.6)", "Run tests (3.7)"
jobs:
  test:
    name: Run tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python: [3.6, 3.7]
```

## Development

### Setup

```bash
npm install
```

### Local Testing with act

You can use [act](https://github.com/nektos/act) to test the action locally:

```bash
# Dry run (tests that action loads correctly)
act -j local-test-dry-run --container-architecture linux/amd64

# Full test (requires GitHub token)
act -j local-test -s GITHUB_TOKEN=$GITHUB_TOKEN --container-architecture linux/amd64
```

**Note:** Since this action calls the GitHub Checks API, full local testing requires:
- A real `GITHUB_TOKEN` with repo permissions
- The repository must exist on GitHub
- The ref must point to a real commit with check runs

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
npm run format:check
```

### All checks

```bash
npm run all
```

## Contributing

This repository adheres to semantic versioning standards. For more information on semantic versioning visit [SemVer](https://semver.org).

## License

MIT
