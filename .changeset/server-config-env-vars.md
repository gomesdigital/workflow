---
"@workflow/web": patch
---

Add server-side environment variable support for self-hosted deployments

- Added `ServerConfigProvider` context to pass server-side config to client components
- Created `getServerConfig()` to read env vars (`WORKFLOW_TARGET_WORLD`, `WORKFLOW_VERCEL_ENV`, etc.)
- Modified `useQueryParamConfig` to merge server config with URL params (URL takes priority)
- Removed auth token input from settings UI for security - must now be set via `WORKFLOW_VERCEL_AUTH_TOKEN` env var
- Fixed infinite re-render loop in settings sidebar with `useMemo`

This enables self-hosted deployments to configure the web UI via environment variables without exposing sensitive data in URL query parameters.
