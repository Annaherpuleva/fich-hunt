import './css/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import App from './App';
import WalletContextProvider from './WalletProvider';
import { enableAssetFallback } from './utils/assetFallback';

enableAssetFallback();

const container = document.getElementById('root');
if (!container) throw new Error('Root container not found');

createRoot(container).render(
  <TonConnectUIProvider manifestUrl="https://fish-huting.pro/tonconnect-manifest.json">
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </TonConnectUIProvider>,
);
