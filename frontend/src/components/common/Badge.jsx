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
    default: "bg-[#DDF0E3] text-[#103342] border border-[#D8E6DA]",
    upToDate: "bg-[#DDF0E3] text-[#007F68] border border-[#007F68]/30 font-semibold",
    dueSoon: "bg-[#FDF8EF] text-[#B87D14] border border-[#F4B83F]/50 font-semibold",
    overdue: "bg-[#FDECEC] text-[#D9534F] border border-[#E57373]/50 font-semibold",
    simulated: "bg-[#F0EBE1] text-[#103342] border border-[#D8E6DA] font-semibold",
    teal: "bg-[#DDF0E3] text-[#007F68] border border-[#007F68]/30 font-semibold",
    navy: "bg-[#103342] text-white",
  };

  return (
    <span className={clsx(base, sizes[size], variants[variant] || variants.default, className)}>
      {children}
    </span>
  );
}
