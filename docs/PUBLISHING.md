# Publishing

This repository can publish two artifacts:

- Python package: `out-of-black-ink` on PyPI
- Web package: `@doradsoft/out-of-black-ink-web` on npm

The public web app itself is deployed to GitHub Pages from `apps/web/dist`.

## PyPI Token

The Python publish workflow reads:

```text
PYPI_API_TOKEN
TEST_PYPI_API_TOKEN
```

Add them in GitHub:

```text
Settings > Secrets and variables > Actions > New repository secret
```

### First PyPI Publish

PyPI project-scoped tokens can only be created after the project exists. For the first publish,
use one of these options:

1. Recommended: configure PyPI Trusted Publishing for this GitHub repository and remove token
   usage later.
2. Token fallback: create an account-scoped PyPI API token, publish `0.1.0`, then replace it
   with a project-scoped token for `out-of-black-ink`.

For the token fallback:

1. Sign in to <https://pypi.org/>.
2. Go to `Account settings > API tokens`.
3. Create a token.
4. For the first upload, scope may need to be `Entire account`.
5. Copy the token once.
6. Add it to GitHub as `PYPI_API_TOKEN`.

Repeat the same process on <https://test.pypi.org/> and add the token as
`TEST_PYPI_API_TOKEN`.

After the package exists on PyPI, rotate the token:

1. Delete the account-scoped token.
2. Create a new token scoped only to `out-of-black-ink`.
3. Replace `PYPI_API_TOKEN` in GitHub.

## npm Token

The npm publish workflow reads:

```text
NPM_TOKEN
```

The workflow publishes from `apps/web` with:

```bash
npm publish --provenance --access public
```

Before publishing:

1. Sign in to <https://www.npmjs.com/>.
2. Ensure you own or create the `@doradsoft` scope.
3. Create an access token with publish rights for `@doradsoft/out-of-black-ink-web`.
4. If your npm account uses 2FA, use a token type suitable for automation publishing.
5. Add the token to GitHub as `NPM_TOKEN`.

If you prefer npm Trusted Publishing later, configure the package on npm for GitHub Actions
OIDC and remove the long-lived `NPM_TOKEN`.

## Release Flow

1. Update versions in:
   - `pyproject.toml`
   - `apps/web/package.json`
   - `apps/cloudflare-worker/package.json`
2. Run all checks locally:

   ```bash
   python -m ruff check .
   python -m pytest
   python -m build
   cd apps/web
   npm run check
   cd ../cloudflare-worker
   npm run check
   npm test
   ```

3. Commit and push.
4. Create a GitHub release.
5. The PyPI and npm publish workflows run from the release.

Manual dry runs:

- `Publish` workflow can publish to TestPyPI.
- `Publish Web Package` workflow can be run manually once `NPM_TOKEN` is available.
