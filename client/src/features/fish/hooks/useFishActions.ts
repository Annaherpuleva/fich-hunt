import { useTx } from '../../../components/TxOverlay';
import { getApiBaseUrlSync } from '../../../shared/api/baseUrl';
import { fetchCompat } from '../../../shared/api/compat';

export type TxEntityMeta = {
  fishId?: number;
  name?: string;
  valueText?: string;
  avatarUrl?: string | null;
  feedDeltaSol?: number;
  feedPercent?: number;
  huntGainSol?: number;
  recipient?: string;
  payoutSol?: number;
};

type FeedParams = {
  fishId: number;
  amountLamports: number;
  processingText: string;
  actionText: string;
  waitingForCloseTx: () => Promise<Partial<TxEntityMeta>>;
  entity?: TxEntityMeta;
};

type MarkParams = {
  hunterId?: number;
  preyId: number;
  markCostLamports?: number;
  processingText: string;
  actionText: string;
  waitingForCloseTx: () => Promise<void>;
  entity?: TxEntityMeta;
};

type HuntParams = {
  hunterId: number;
  preyId: number;
  processingText: string;
  actionText: string;
  waitingForCloseTx: () => Promise<void>;
  entity?: TxEntityMeta;
};

type ExitParams = {
  fishId: number;
  processingText: string;
  actionText: string;
  waitingForCloseTx: () => Promise<void>;
  entity?: TxEntityMeta;
};

type TransferParams = {
  fishId: number;
  newOwner: string;
  processingText: string;
  actionText: string;
  entity?: TxEntityMeta;
};

type BackendFish = { id: number; version: number };

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('authToken') || window.localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(path: string, init?: RequestInit): Promise<any> {
  const base = getApiBaseUrlSync();
  const res = await fetchCompat(base, path, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(init?.headers || {}),
    },
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload?.error || payload?.message || `Request failed with ${res.status}`;
    throw new Error(String(message));
  }
  return payload;
}

async function getFishVersion(fishId: number): Promise<number> {
  const fish = (await apiRequest(`/api/fish/${fishId}`)) as BackendFish;
  if (!Number.isFinite(Number(fish?.version))) {
    throw new Error('Invalid fish version');
  }
  return Number(fish.version);
}

export function useFishActions() {
  const { runTx } = useTx();

  const feedFish = async ({ fishId, amountLamports, processingText, actionText, entity, waitingForCloseTx }: FeedParams) => {
    await runTx(
      async () => {
        const expectedVersion = await getFishVersion(fishId);
        await apiRequest(`/api/fish/${fishId}/feed`, {
          method: 'POST',
          body: JSON.stringify({
            amountUnits: String(Math.max(1, Math.floor(amountLamports))),
            expectedVersion,
          }),
        });

        const updatedEntity = await waitingForCloseTx();
        if (entity && updatedEntity && Object.keys(updatedEntity).length) {
          Object.entries(updatedEntity).forEach(([key, value]) => {
            const typedKey = key as keyof TxEntityMeta;
            entity[typedKey] = value as TxEntityMeta[keyof TxEntityMeta];
          });
        }

        return `backend-feed-${fishId}-${Date.now()}`;
      },
      processingText,
      { actionText, entity, successKind: 'feed' },
    );
  };

  const placeMark = async ({ hunterId, preyId, processingText, actionText, entity, waitingForCloseTx }: MarkParams) => {
    await runTx(
      async () => {
        const myFish = (await apiRequest('/api/me/fish')) as BackendFish[];
        const hunterFish = (Array.isArray(myFish) ? myFish : []).find((fish) => Number(fish?.id) === Number(hunterId)) || myFish?.[0];
        if (!hunterFish?.id) throw new Error('No hunter fish');

        const preyVersion = await getFishVersion(preyId);
        await apiRequest(`/api/fish/${hunterFish.id}/place-mark`, {
          method: 'POST',
          body: JSON.stringify({
            preyFishId: preyId,
            expectedHunterVersion: Number(hunterFish.version),
            expectedPreyVersion: preyVersion,
          }),
        });

        await waitingForCloseTx();
        return `backend-mark-${hunterFish.id}-${preyId}-${Date.now()}`;
      },
      processingText,
      { actionText, entity, successKind: 'mark' },
    );
  };

  const huntFish = async ({ hunterId, preyId, processingText, actionText, entity, waitingForCloseTx }: HuntParams) => {
    await runTx(
      async () => {
        const hunterVersion = await getFishVersion(hunterId);
        const preyVersion = await getFishVersion(preyId);

        await apiRequest(`/api/fish/${hunterId}/hunt`, {
          method: 'POST',
          body: JSON.stringify({
            preyFishId: preyId,
            expectedHunterVersion: hunterVersion,
            expectedPreyVersion: preyVersion,
          }),
        });

        await waitingForCloseTx();
        return `backend-hunt-${hunterId}-${preyId}-${Date.now()}`;
      },
      processingText,
      { actionText, entity, successKind: 'hunt' },
    );
  };

  const exitFish = async ({ fishId, processingText, actionText, entity, waitingForCloseTx }: ExitParams) => {
    await runTx(
      async () => {
        const expectedVersion = await getFishVersion(fishId);
        await apiRequest(`/api/fish/${fishId}/exit`, {
          method: 'POST',
          body: JSON.stringify({ expectedVersion }),
        });

        await waitingForCloseTx();
        return `backend-exit-${fishId}-${Date.now()}`;
      },
      processingText,
      { actionText, entity, successKind: 'sell' as any },
    );
  };

  const transferFish = async ({ fishId, newOwner, processingText, actionText, entity }: TransferParams) => {
    await runTx(
      async () => {
        const newOwnerUserId = Number(newOwner);
        if (!Number.isFinite(newOwnerUserId) || newOwnerUserId <= 0) {
          throw new Error('Transfer requires numeric user id for the new backend');
        }

        const expectedVersion = await getFishVersion(fishId);
        await apiRequest(`/api/fish/${fishId}/transfer`, {
          method: 'POST',
          body: JSON.stringify({
            newOwnerUserId,
            expectedVersion,
          }),
        });

        return `backend-transfer-${fishId}-${newOwnerUserId}-${Date.now()}`;
      },
      processingText,
      { actionText, entity, successKind: 'gift' },
    );
  };

  return { feedFish, placeMark, huntFish, exitFish, transferFish };
}
