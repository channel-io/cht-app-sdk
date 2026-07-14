# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management.

## Adding a changeset

When making a change that should trigger a version bump:

```bash
pnpm changeset
```

Follow the prompts to:

1. Select which packages have changed
2. Choose the version bump type (major/minor/patch)
3. Write a summary of the changes

## Releasing

Releases are automated via GitHub Actions. When changesets are merged to main:

1. A "Release" PR is created with version bumps
2. When merged, packages are published to npm
