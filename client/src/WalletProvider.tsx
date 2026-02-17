import React from 'react';
import { TonWalletProvider } from './wallet/tonWallet';

export default function WalletContextProvider({ children }: { children: React.ReactNode }) {
  return <TonWalletProvider>{children}</TonWalletProvider>;
}
