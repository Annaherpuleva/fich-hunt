import { fetchCompat } from './compat';
import { getApiBaseUrlSync } from './baseUrl';

function isHtmlResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type') || '';
  return /text\/html|application\/xhtml\+xml/i.test(contentType);
}

export async function getJson<T = any>(path: string): Promise<T> {
  const normalizedBase = getApiBaseUrlSync();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const response = await fetchCompat(normalizedBase, normalizedPath, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`GET ${normalizedPath} failed with status ${response.status}`);
  }

  if (isHtmlResponse(response)) {
    throw new Error(`GET ${normalizedPath} returned HTML instead of JSON`);
  }

  return response.json();
}
