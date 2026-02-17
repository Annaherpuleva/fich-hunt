import { getOceanState } from '../../../shared/api/fishApi';

export type OceanState = {
  isStorm: boolean;
  feedingPercentage: number;
  updatedAt: string;
};

let cache: { data: OceanState; ts: number } | null = null;

export async function fetchOcean(): Promise<OceanState> {
  if (cache && Date.now() - cache.ts < 10_000) return cache.data;
  const data = await getOceanState();
  cache = { data, ts: Date.now() };
  return data;
}

export async function fetchOceanSafe(): Promise<OceanState> {
  try {
    return await fetchOcean();
  } catch {
    return { isStorm: false, feedingPercentage: 5, updatedAt: new Date().toISOString() };
  }
}
