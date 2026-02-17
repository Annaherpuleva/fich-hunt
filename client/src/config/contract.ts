import {
  deriveOceanServiceKey,
  getOceanConfig,
  getOceanService,
  getServiceId,
  getServiceIdFromConfig,
} from './runtimeGame';

let warned = false;

function warnDeprecated(message: string) {
  if (warned || typeof console === 'undefined') return;
  warned = true;
  console.warn(message);
}

/** @deprecated Use getServiceIdFromConfig from config/runtimeGame instead. */
export function getProgramIdFromConfig(cfg: { PROGRAM_ID?: string; SERVICE_ID?: string; OCEAN_TON?: string }) {
  warnDeprecated('[deprecated] config/contract.ts is deprecated. Use config/runtimeGame.ts APIs.');
  return getServiceIdFromConfig(cfg);
}

/** @deprecated Use getServiceId from config/runtimeGame instead. */
export async function getProgramId() {
  warnDeprecated('[deprecated] getProgramId() is deprecated. Use getServiceId().');
  return getServiceId();
}

/** @deprecated Use getOceanService from config/runtimeGame instead. */
export async function getProgram(connection?: { endpoint: string; commitment?: string }, wallet?: any) {
  warnDeprecated('[deprecated] getProgram() is deprecated. Use getOceanService().');
  return getOceanService(connection, wallet);
}

/** @deprecated Use getOceanConfig from config/runtimeGame instead. */
export async function getConfig() {
  warnDeprecated('[deprecated] getConfig() is deprecated. Use getOceanConfig().');
  const cfg = await getOceanConfig();
  return {
    ...cfg,
    programId: cfg.serviceId,
  };
}

/** @deprecated Use deriveOceanServiceKey from config/runtimeGame instead. */
export function deriveOceanPda(programId: string): string {
  warnDeprecated('[deprecated] deriveOceanPda() is deprecated. Use deriveOceanServiceKey().');
  return deriveOceanServiceKey(programId);
}
