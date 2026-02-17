import { getJson } from './http';

export function getOceanState() {
  return getJson('/api/ocean/state?ocean=OceanTON');
}

export function getEvents(limit: number = 200) {
  return getJson(`/api/events?limit=${encodeURIComponent(limit)}`);
}

export function getMyFish(owner: string) {
  return getJson(`/api/me-fish?owner=${encodeURIComponent(owner)}`);
}

export function getPrey(hungry: boolean = true) {
  return getJson(`/api/prey?hungry=${encodeURIComponent(String(hungry))}`);
}
