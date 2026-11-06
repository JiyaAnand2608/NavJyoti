import React from 'react';
import clsx from 'clsx';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
    icon: "p-2 rounded-lg",
  };

  const variants = {
    primary: "bg-[#007F68] hover:bg-[#005F52] text-white shadow-xs hover:shadow focus:ring-[#007F68]",
    secondary: "bg-[#103342] hover:bg-[#005F52] text-white shadow-xs hover:shadow focus:ring-[#103342]",
    teal: "bg-[#005F52] hover:bg-[#007F68] text-white shadow-xs focus:ring-[#005F52]",
    gold: "bg-[#F4B83F] hover:bg-[#dfa62d] text-[#103342] font-semibold shadow-xs focus:ring-[#F4B83F]",
    outline: "bg-[#FBF8F2] hover:bg-white text-[#103342] border border-[#D8E6DA] hover:border-[#007F68] focus:ring-[#007F68]",
    ghost: "text-[#294B57] hover:bg-[#DDF0E3]/60 hover:text-[#103342] focus:ring-[#A8D5B5]",
    danger: "bg-[#E57373] hover:bg-[#d25f5f] text-white focus:ring-[#E57373]",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(base, sizes[size], variants[variant] || variants.primary, className)}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
    </button>
  );
}
