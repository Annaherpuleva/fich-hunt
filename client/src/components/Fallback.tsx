import React from "react";

export const Fallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101014]">
      <div className="flex flex-col items-center gap-3 text-white/70 text-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    </div>
  );
};