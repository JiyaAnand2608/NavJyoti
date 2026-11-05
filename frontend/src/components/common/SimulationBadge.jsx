import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export function SimulationBadge({ label = "Simulated Feature", tooltip = "Prototype demo feature — not connected to a live government server" }) {
  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-300"
    >
      <Sparkles className="w-3 h-3 text-amber-600" />
      <span>{label}</span>
    </span>
  );
}

export function SimulationBanner({ title = "Prototype Simulation Notice", message }) {
  return (
    <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900 mb-4">
      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold block">{title}</span>
        <span className="text-amber-800">{message}</span>
      </div>
    </div>
  );
}
