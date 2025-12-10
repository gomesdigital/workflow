# @workflow/web

Observability Web UI Package bundled in the [Workflow DevKit](https://useworkflow.dev/docs/observability).

## Self-hosting

While this UI is bundled with the Workflow CLI, you can also self-host it by cloning this repository and
deploying it like any other NextJS app.

For API calls to work, you'll need to pass the same environment variables to the NextJS app that are
used by the Workflow CLI. See `npx workflow inspect --help` for more information on the available environment variables.


If you're deploying to Vercel:
1. Fill in all environment variables in the Vercel UI
1. Set `WORKFLOW_TARGET_WORLD` to `vercel`


> [!TIP]
> The UI will not connect to your backend by default. Go Settings -> Backend -> Select `vercel`.

> [!CAUTION]
> Once your env vars are set, you only need to set the Backend field in the UI. Setting any of the other fields will append them as query params which risks exposing your sensitive credentials.


Note that observability will be scoped to the project
and environment you're deploying to.
