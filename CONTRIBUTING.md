# Contributing

Thanks for contributing to Markdown for Agents.

## Prerequisites

- Bun 1.3+
- Node.js 20+

## Setup

```bash
bun install
```

## Development

Run all apps:

```bash
bun run dev
```

Run only API:

```bash
bun run --filter @markdownforagents/api dev
```

Run only web app:

```bash
bun run --filter markdownforagents-web dev
```

## Testing

```bash
bun run test
```

## Pull requests

- Keep PRs focused and small when possible
- Add tests for behavior changes
- Keep existing code style and naming conventions
- Update docs when endpoints, behavior, or configuration changes

## Security

Please do not open public issues for sensitive vulnerabilities.
Instead, contact the maintainer directly.
