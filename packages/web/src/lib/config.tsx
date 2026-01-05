'use client';

import type { EnvMap } from '@workflow/web-shared/server';
import { createSerializer, parseAsString, useQueryStates } from 'nuqs';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { WorldConfig } from '@/lib/config-world';

// Default configuration (fallback when no server config or URL params)
const DEFAULT_CONFIG: WorldConfig = {
  backend: 'local',
  dataDir: './.next/workflow-data',
  port: '3000',
  env: 'production',
};

/**
 * Context for server-side configuration read from environment variables.
 * This allows self-hosted deployments to configure the UI via env vars.
 */
const ServerConfigContext = createContext<WorldConfig | null>(null);

/**
 * Provider component that passes server-side config to client components.
 * Wrap the app with this provider in layout.tsx.
 */
export function ServerConfigProvider({
  config,
  children,
}: {
  config: WorldConfig;
  children: ReactNode;
}) {
  return (
    <ServerConfigContext.Provider value={config}>
      {children}
    </ServerConfigContext.Provider>
  );
}

/**
 * Hook to access server-side config from context.
 */
export function useServerConfig(): WorldConfig | null {
  return useContext(ServerConfigContext);
}

// nuqs parsers for config params
const configParsers = {
  backend: parseAsString.withDefault(DEFAULT_CONFIG.backend || 'embedded'),
  env: parseAsString.withDefault(DEFAULT_CONFIG.env || 'production'),
  authToken: parseAsString,
  project: parseAsString,
  team: parseAsString,
  port: parseAsString.withDefault(DEFAULT_CONFIG.port || '3000'),
  dataDir: parseAsString.withDefault(
    DEFAULT_CONFIG.dataDir || './.next/workflow-data'
  ),
  manifestPath: parseAsString,
  postgresUrl: parseAsString,
};

/**
 * Helper to convert null values to undefined for WorldConfig compatibility.
 * nuqs uses null for absent values, but WorldConfig uses undefined.
 */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

// Create a serializer for config params
const serializeConfig = createSerializer(configParsers);
export const resolveTargetWorld = (backend?: string) => {
  switch (backend) {
    case 'postgres':
      return '@workflow/world-postgres';
    default:
      return backend;
  }
};

/**
 * Hook that reads query params and returns the current config.
 * Uses nuqs for type-safe URL state management.
 *
 * Config priority (highest to lowest):
 * 1. URL query params (for CLI compatibility)
 * 2. Server-side env vars (for self-hosted deployments)
 * 3. Default values (fallback)
 */
export function useQueryParamConfig(): WorldConfig {
  const serverConfig = useServerConfig();
  const [urlConfig] = useQueryStates(configParsers, {
    history: 'push',
    shallow: true,
  });

  // Memoize merged config to prevent infinite re-renders
  // Dependencies are the individual values, not object references
  return useMemo(() => {
    // Convert nuqs null values to undefined for WorldConfig compatibility
    // and merge with server config (server config used when URL is at default)
    const mergedConfig: WorldConfig = {
      backend: urlConfig.backend,
      env: urlConfig.env,
      authToken: nullToUndefined(urlConfig.authToken),
      project: nullToUndefined(urlConfig.project),
      team: nullToUndefined(urlConfig.team),
      port: urlConfig.port,
      dataDir: urlConfig.dataDir,
      manifestPath: nullToUndefined(urlConfig.manifestPath),
      postgresUrl: nullToUndefined(urlConfig.postgresUrl),
    };

    if (serverConfig) {
      // For each field, use server config if URL is at default (or empty)
      if (
        serverConfig.backend &&
        urlConfig.backend === DEFAULT_CONFIG.backend
      ) {
        mergedConfig.backend = serverConfig.backend;
      }
      if (serverConfig.env && urlConfig.env === DEFAULT_CONFIG.env) {
        mergedConfig.env = serverConfig.env;
      }
      if (serverConfig.project && !urlConfig.project) {
        mergedConfig.project = serverConfig.project;
      }
      if (serverConfig.team && !urlConfig.team) {
        mergedConfig.team = serverConfig.team;
      }
      if (serverConfig.port && urlConfig.port === DEFAULT_CONFIG.port) {
        mergedConfig.port = serverConfig.port;
      }
      if (
        serverConfig.dataDir &&
        urlConfig.dataDir === DEFAULT_CONFIG.dataDir
      ) {
        mergedConfig.dataDir = serverConfig.dataDir;
      }
      if (serverConfig.manifestPath && !urlConfig.manifestPath) {
        mergedConfig.manifestPath = serverConfig.manifestPath;
      }
      if (serverConfig.postgresUrl && !urlConfig.postgresUrl) {
        mergedConfig.postgresUrl = serverConfig.postgresUrl;
      }
    }

    return mergedConfig;
  }, [
    urlConfig.backend,
    urlConfig.env,
    urlConfig.authToken,
    urlConfig.project,
    urlConfig.team,
    urlConfig.port,
    urlConfig.dataDir,
    urlConfig.manifestPath,
    urlConfig.postgresUrl,
    serverConfig,
  ]);
}

/**
 * Hook that returns a function to update config query params
 * Uses nuqs for type-safe URL state management
 * Preserves all other query params while updating config params
 */
export function useUpdateConfigQueryParams() {
  const [, setConfig] = useQueryStates(configParsers, {
    history: 'push',
    shallow: true,
  });

  return (newConfig: WorldConfig) => {
    // Filter out null/undefined values and only set non-default values
    const filtered: Record<string, string | null> = {};

    for (const [key, value] of Object.entries(newConfig)) {
      if (value === undefined || value === null || value === '') {
        filtered[key] = null; // nuqs uses null to clear params
      } else if (value !== DEFAULT_CONFIG[key as keyof WorldConfig]) {
        filtered[key] = value;
      } else {
        filtered[key] = null;
      }
    }

    setConfig(filtered);
  };
}

/**
 * Helper to build a URL with config params while preserving other params
 * Uses nuqs serializer for type-safe URL construction
 */
export function buildUrlWithConfig(
  path: string,
  config: WorldConfig,
  additionalParams?: Record<string, string>
): string {
  // Serialize config params using nuqs
  const queryString = serializeConfig(config);
  const params = new URLSearchParams(queryString);

  // Add additional params
  if (additionalParams) {
    for (const [key, value] of Object.entries(additionalParams)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      }
    }
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export const worldConfigToEnvMap = (config: WorldConfig): EnvMap => {
  return {
    WORKFLOW_TARGET_WORLD: resolveTargetWorld(config.backend),
    WORKFLOW_VERCEL_ENV: config.env,
    WORKFLOW_VERCEL_AUTH_TOKEN: config.authToken,
    WORKFLOW_VERCEL_PROJECT: config.project,
    WORKFLOW_VERCEL_TEAM: config.team,
    PORT: config.port,
    WORKFLOW_MANIFEST_PATH: config.manifestPath,
    WORKFLOW_LOCAL_DATA_DIR: config.dataDir,
    // Postgres env vars
    WORKFLOW_POSTGRES_URL: config.postgresUrl,
  };
};
