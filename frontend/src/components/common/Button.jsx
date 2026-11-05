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
    primary: "bg-[#00524c] hover:bg-[#27756c] text-white shadow-xs hover:shadow focus:ring-[#00524c]",
    secondary: "bg-[#17394A] hover:bg-[#0f2632] text-white shadow-xs hover:shadow focus:ring-[#17394A]",
    gold: "bg-[#F5C45E] hover:bg-[#dca948] text-[#17394A] font-semibold shadow-xs focus:ring-[#F5C45E]",
    outline: "bg-white hover:bg-slate-50 text-[#17394A] border border-slate-200 hover:border-slate-300 focus:ring-slate-300",
    ghost: "text-[#17394A] hover:bg-slate-100 focus:ring-slate-200",
    danger: "bg-[#D9847D] hover:bg-[#c26d66] text-white focus:ring-[#D9847D]",
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
