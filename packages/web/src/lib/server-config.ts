import type { WorldConfig } from './config-world';

/**
 * Read server-side environment variables and return as WorldConfig.
 * This enables self-hosted deployments to configure the UI via env vars
 * without requiring URL query parameters.
 *
 * Note: authToken is intentionally excluded from the returned config
 * to prevent it from being exposed to the client. Server actions
 * read it directly from process.env.
 */
export function getServerConfig(): WorldConfig {
  const config: WorldConfig = {};

  // Only include non-empty values to avoid serialization issues
  if (process.env.WORKFLOW_TARGET_WORLD) {
    config.backend = process.env.WORKFLOW_TARGET_WORLD;
  }
  if (process.env.WORKFLOW_VERCEL_ENV) {
    config.env = process.env.WORKFLOW_VERCEL_ENV;
  }
  if (process.env.WORKFLOW_VERCEL_PROJECT) {
    config.project = process.env.WORKFLOW_VERCEL_PROJECT;
  }
  if (process.env.WORKFLOW_VERCEL_TEAM) {
    config.team = process.env.WORKFLOW_VERCEL_TEAM;
  }
  if (process.env.PORT) {
    config.port = process.env.PORT;
  }
  if (process.env.WORKFLOW_LOCAL_DATA_DIR) {
    config.dataDir = process.env.WORKFLOW_LOCAL_DATA_DIR;
  }
  if (process.env.WORKFLOW_MANIFEST_PATH) {
    config.manifestPath = process.env.WORKFLOW_MANIFEST_PATH;
  }
  if (process.env.WORKFLOW_POSTGRES_URL) {
    config.postgresUrl = process.env.WORKFLOW_POSTGRES_URL;
  }
  // authToken intentionally omitted - stays server-side only

  return config;
}
