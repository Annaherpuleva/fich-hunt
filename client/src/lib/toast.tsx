import React from 'react';

export const toast = {
  success: (message: string) => console.info('[toast:success]', message),
  error: (message: string) => console.error('[toast:error]', message),
  info: (message: string) => console.info('[toast:info]', message),
};

export const ToastContainer: React.FC<Record<string, unknown>> = () => null;
