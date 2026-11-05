import React from 'react';
import clsx from 'clsx';

export function Card({
  children,
  className = '',
  hoverEffect = false,
  glass = false,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        "rounded-2xl transition-all duration-200 border border-slate-200/80",
        glass ? "glass-panel" : "bg-white",
        hoverEffect ? "hover:shadow-md hover:border-slate-300" : "shadow-sm",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', title, subtitle, action }) {
  if (title || subtitle || action) {
    return (
      <div className={clsx("p-5 border-b border-slate-100 flex items-start justify-between gap-4", className)}>
        <div>
          {title && <h3 className="text-base font-semibold text-[#17394A]">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
  return <div className={clsx("p-5 border-b border-slate-100", className)}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={clsx("p-4 bg-slate-50/60 border-t border-slate-100 rounded-b-2xl", className)}>{children}</div>;
}
