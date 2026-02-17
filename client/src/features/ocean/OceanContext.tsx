import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { OceanState, fetchOceanSafe } from './api/ocean.api';

export type OceanKind = 'OceanTON';

type OceanCtx = {
  selectedOcean: OceanKind;
  setSelectedOcean: (_ocean: OceanKind) => void;
  oceanState: OceanState | null;
  refreshOceanState: () => Promise<void>;
};

const Ctx = createContext<OceanCtx | null>(null);

export const OceanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedOcean] = useState<OceanKind>('OceanTON');
  const [oceanState, setOceanState] = useState<OceanState | null>(null);

  const refreshOceanState = async () => {
    const state = await fetchOceanSafe();
    setOceanState(state);
  };

  useEffect(() => {
    refreshOceanState();
  }, []);

  const value = useMemo(() => ({ selectedOcean, setSelectedOcean: () => undefined, oceanState, refreshOceanState }), [selectedOcean, oceanState]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useOcean() {
  const value = useContext(Ctx);
  if (!value) throw new Error('useOcean must be used inside OceanProvider');
  return value;
}
