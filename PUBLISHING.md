# Publishing AGRIS to npm

This document provides instructions for publishing the AGRIS browser to npm.

## Prerequisites

1. Make sure you have an npm account
2. Login to npm from the command line
3. Ensure all tests pass
4. Update version number in package.json
5. Update CHANGELOG.md

## Publishing Steps

1. **Login to npm**

```bash
npm login
```

2. **Run tests to ensure everything works**

```bash
npm test
```

3. **Create or update CHANGELOG.md**

Document all changes in the CHANGELOG.md file.

4. **Update the version**

Update the version in package.json according to semver principles:
- MAJOR version for incompatible API changes
- MINOR version for added functionality in a backward compatible manner
- PATCH version for backward compatible bug fixes

5. **Run the prepublish script**

```bash
npm run prepublishOnly
```

6. **Publish to npm**

```bash
npm publish
```

Or for a beta version:

```bash
npm publish --tag beta
```

7. **Verify the published package**

```bash
npm view agris
```

## Release Checklist

- [ ] All tests pass
- [ ] Version updated in package.json
- [ ] CHANGELOG.md updated
- [ ] README.md updated with new features
- [ ] All dependencies correctly listed in package.json
- [ ] Git repository tagged with version number
- [ ] All new features documented
- [ ] All breaking changes noted in CHANGELOG.md

## After Publishing

1. Tag the release in git:

```bash
git tag v1.1.0
git push origin v1.1.0
```

2. Create a release on GitHub with the release notes from CHANGELOG.md