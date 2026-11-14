import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export function SimulationBadge({ label = "Simulated Feature", tooltip = "Prototype demo feature — not connected to a live government server" }) {
  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0EBE1] text-[#103342] border border-[#D8E6DA]"
    >
      <Sparkles className="w-3 h-3 text-[#F4B83F]" />
      <span>{label}</span>
    </span>
  );
}

export function SimulationBanner({ title = "Prototype Simulation Notice", message }) {
  return (
    <div className="bg-[#DDF0E3]/70 border border-[#D8E6DA] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#103342] mb-4">
      <Info className="w-4 h-4 text-[#007F68] shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold block">{title}</span>
        <span className="text-[#294B57]">{message}</span>
      </div>
    </div>
  );
}
