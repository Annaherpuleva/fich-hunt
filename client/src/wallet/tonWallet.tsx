import React, { createContext, useContext } from 'react';
import { useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

export enum WalletReadyState {
  Installed = 'Installed',
  Loadable = 'Loadable',
  Unsupported = 'Unsupported',
  MobileBrowser = 'MobileBrowser',
}

type WalletAdapterLike = {
  name: string;
  icon: string;
  publicKey: { toBase58: () => string; toString: () => string; toBuffer: () => any } | null;
};

type WalletOption = {
  adapter: WalletAdapterLike;
  readyState: WalletReadyState;
};

type WalletContextState = {
  wallet: WalletOption | null;
  wallets: WalletOption[];
  publicKey: { toBase58: () => string; toString: () => string; toBuffer: () => any } | null;
  connected: boolean;
  connecting: boolean;
  select: (_name: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction?: (tx: any) => Promise<any>;
  signAllTransactions?: (txs: any[]) => Promise<any[]>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
};

const Ctx = createContext<WalletContextState | null>(null);
const makePk = (address: string) => ({ toBase58: () => address, toString: () => address, toBuffer: () => new TextEncoder().encode(address) as any });

export const TonWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tonConnectUI] = useTonConnectUI();
  const tonWallet = useTonWallet();
  const address = useTonAddress(false);

  const connectedWallet: WalletOption | null = tonWallet
    ? {
      adapter: {
        name: tonWallet.device.appName || 'TON Wallet',
        icon: tonWallet.imageUrl || '/img/icon-wallet-new.svg',
        publicKey: address ? makePk(address) : null,
      },
      readyState: WalletReadyState.Installed,
    }
    : null;

  const state: WalletContextState = {
    wallet: connectedWallet,
    wallets: connectedWallet ? [connectedWallet] : [],
    publicKey: address ? makePk(address) : null,
    connected: !!tonWallet,
    connecting: false,
    select: () => {},
    connect: async () => {
      await tonConnectUI.openModal();
    },
    disconnect: async () => {
      await tonConnectUI.disconnect();
    },
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
    signMessage: async () => {
      throw new Error('Message signing is not supported for TON wallet');
    },
  };

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
};

export const useWallet = () => {
  const value = useContext(Ctx);
  if (!value) throw new Error('useWallet must be used within TonWalletProvider');
  return value;
};
