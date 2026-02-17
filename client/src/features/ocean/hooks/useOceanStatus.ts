import { useOcean } from '../OceanContext';

export function useOceanStatus() {
  const { oceanState } = useOcean();

  return {
    isStorm: oceanState?.isStorm ?? null,
    loading: oceanState === null,
    nextModeChangeTime: null,
    oceanPda: null,
  };
}
