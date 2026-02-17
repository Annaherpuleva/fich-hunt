import { getApiBaseUrlSync } from './baseUrl';
import { fetchCompat } from './compat';

async function getJsonCompat(path: string) {
  const base = getApiBaseUrlSync();
  const token = typeof window !== 'undefined'
    ? (window.localStorage.getItem('authToken') || window.localStorage.getItem('accessToken'))
    : null;
  const res = await fetchCompat(base, path, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    throw new Error(`Request failed with ${res.status}`);
  }
  return res.json();
}

export function getOceanState() {
  return getJsonCompat('/api/v1/ocean/state');
}

export function getEvents(limit: number = 200) {
  return getJsonCompat(`/api/events?limit=${encodeURIComponent(limit)}`);
}

export function getMyFish(_owner?: string) {
  return getJsonCompat('/api/v1/me/fish');
}

export function getPrey(hungry: boolean = true) {
  return getJsonCompat(`/api/prey?hungry=${encodeURIComponent(String(hungry))}`);
}
