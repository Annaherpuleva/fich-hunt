declare module '*.module.css';
declare module 'node-telegram-bot-api';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
      };
    };
  }
}

export {};
