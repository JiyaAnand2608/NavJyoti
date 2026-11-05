import React from 'react';
import clsx from 'clsx';

export function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const base = "inline-flex items-center font-medium rounded-full";
  
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1 text-sm",
  };

  const variants = {
    default: "bg-[#EAF5F8] text-[#17394A] border border-[#d5e5f0]",
    upToDate: "bg-[#E8F3EE] text-[#00524c] border border-[#00524c]/30",
    dueSoon: "bg-[#fdf8ef] text-[#dca948] border border-[#F5C45E]/40",
    overdue: "bg-[#fdf2f1] text-[#D9847D] border border-[#D9847D]/40",
    simulated: "bg-amber-50 text-amber-800 border border-amber-300 font-semibold",
    teal: "bg-[#00524c]/10 text-[#00524c] border border-[#00524c]/20",
    navy: "bg-[#17394A] text-white",
  };

  return (
    <span className={clsx(base, sizes[size], variants[variant] || variants.default, className)}>
      {children}
    </span>
  );
}
