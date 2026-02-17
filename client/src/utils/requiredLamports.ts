import { COMMISSION_BPS } from '../core/constants';

const BPS_DENOMINATOR = 10_000;
const DEFAULT_FEE_BUFFER_LAMPORTS = 5_000;

const calcBpsPart = (baseLamports: number, bps: number): number => {
  return Math.ceil((baseLamports * bps) / BPS_DENOMINATOR);
};

type RequiredLamportsOptions = {
  rentLamports?: number;
  includeCommission?: boolean;
};

export const getRequiredLamports = (
  baseLamports: number,
  { rentLamports = 0, includeCommission = true }: RequiredLamportsOptions = {}
): number => {
  const commission = includeCommission ? calcBpsPart(baseLamports, COMMISSION_BPS) : 0;

  return baseLamports + commission + rentLamports + DEFAULT_FEE_BUFFER_LAMPORTS;
};
