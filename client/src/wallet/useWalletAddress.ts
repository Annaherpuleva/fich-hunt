import { useTonAddress } from '@tonconnect/ui-react';

export function useWalletAddress(): string {
  return useTonAddress(false) || '';
}
