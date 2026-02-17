import { getApiBaseUrlSync } from './baseUrl';
import { fetchCompat } from './compat';

async function getJsonCompat(path: string) {
  const base = getApiBaseUrlSync();
  const res = await fetchCompat(base, path, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Request failed with ${res.status}`);
  }
  return res.json();
}

export function getOceanState() {
  return getJsonCompat('/api/ocean/state');
}

export function getEvents(limit: number = 200) {
  return getJsonCompat(`/api/events?limit=${encodeURIComponent(limit)}`);
}

export function getMyFish(_owner?: string) {
  return getJsonCompat('/api/me/fish');
}

export function getPrey(hungry: boolean = true) {
  return getJsonCompat(`/api/prey?hungry=${encodeURIComponent(String(hungry))}`);
}
