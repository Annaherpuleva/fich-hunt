const V1_PREFIX = '/api/v1';

const ROUTE_MAP: Array<[RegExp, string]> = [
  [/^\/api\/v1\/events\b/, '/api/events'],
  [/^\/api\/v1\/ocean\/summary\b/, '/api/ocean/state'],
  [/^\/api\/ocean\/summary\b/, '/api/ocean/state'],
  [/^\/api\/v1\/leaderboards\/top-fish\b/, '/api/leaderboards/top-fish'],
  [/^\/api\/v1\//, '/api/'],
];

const MODERN_TO_LEGACY_MAP: Array<[RegExp, string]> = [
  [/^\/api\/events\b/, '/api/v1/events'],
  [/^\/api\/ocean\/state\b/, '/api/v1/ocean/summary'],
  [/^\/api\/ocean\/summary\b/, '/api/v1/ocean/summary'],
  [/^\/api\/leaderboards\/top-fish\b/, '/api/v1/leaderboards/top-fish'],
  [/^\/api\/(?!v1\/)/, '/api/v1/'],
];

function normalizePath(path: string): string {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

function withOrWithoutApiPrefix(path: string, includeNonApiVariant: boolean): string[] {
  const normalized = normalizePath(path);
  if (normalized.startsWith('/api/')) {
    const variants = [normalized];
    if (normalized.startsWith(V1_PREFIX)) {
      variants.push(normalized.replace(/^\/api\/v1/, '/api'));
      variants.push(normalized.replace(/^\/api\/v1/, '/v1'));
    }
    if (includeNonApiVariant) {
      // Some deployments expose only root-level legacy routes.
      variants.push(normalized.replace(/^\/api/, '') || '/');
    }
    return variants;
  }
  // Prefer /v1/* style routes and only then try /api/* compatibility fallback.
  return includeNonApiVariant ? [normalized, `/api${normalized}`] : [`/api${normalized}`];
}

function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return /text\/html|application\/xhtml\+xml/i.test(contentType);
}

export function mapLegacyApiPath(path: string): string {
  for (const [pattern, replacement] of ROUTE_MAP) {
    if (pattern.test(path)) {
      return path.replace(pattern, replacement);
    }
  }
  return path;
}

export function mapModernApiPath(path: string): string {
  for (const [pattern, replacement] of MODERN_TO_LEGACY_MAP) {
    if (pattern.test(path)) {
      return path.replace(pattern, replacement);
    }
  }
  return path;
}

function buildCandidatePaths(path: string, method: string): string[] {
  const normalizedPath = normalizePath(path);
  const candidates = new Set<string>();
  // Some production gateways expose write routes without the `/api` prefix
  // while still serving legacy `/api/v1/*` URLs in other environments.
  // Keep root-level variants for these endpoints as a last-resort fallback.
  const includeNonApiVariant = method === 'GET' || method === 'HEAD' || normalizedPath.startsWith(V1_PREFIX);

  const direct = normalizePath(normalizedPath);
  const legacy = normalizePath(mapLegacyApiPath(normalizedPath));
  const modern = normalizePath(mapModernApiPath(normalizedPath));

  [direct, legacy, modern].forEach((basePath) => {
    withOrWithoutApiPrefix(basePath, includeNonApiVariant).forEach((candidate) => {
      candidates.add(candidate);
      if (candidate.startsWith(V1_PREFIX)) {
        candidates.add(candidate.replace(/^\/api\/v1\//, '/api/'));
      } else if (candidate.startsWith('/api/') && !candidate.startsWith(V1_PREFIX) && includeNonApiVariant) {
        candidates.add(candidate.replace(/^\/api\//, '/api/v1/'));
      }
    });
  });

  return Array.from(candidates);
}

export async function fetchCompat(baseUrl: string, path: string, init?: RequestInit) {
  const base = (baseUrl || '').replace(/\/$/, '');
  const method = String(init?.method || 'GET').toUpperCase();
  const candidates = buildCandidatePaths(path, method);

  let lastResponse: Response | null = null;
  let lastHtmlOkResponse: Response | null = null;

  for (const candidatePath of candidates) {
    const response = await fetch(`${base}${candidatePath}`, init);

    if (response.ok) {
      if (isHtmlResponse(response)) {
        // Some hosts return index.html (200) for missing API routes.
        // Skip this candidate and continue probing compatible endpoints.
        lastHtmlOkResponse = response;
        continue;
      }
      return response;
    }

    if (response.status === 404 || response.status === 405) {
      lastResponse = response;
      continue;
    }

    return response;
  }

  if (lastResponse) {
    return lastResponse;
  }

  if (lastHtmlOkResponse) {
    return new Response(JSON.stringify({ error: 'API route returned HTML document instead of JSON' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }

  return fetch(`${base}${normalizePath(path.startsWith(V1_PREFIX) ? path : mapLegacyApiPath(path))}`, init);
}
