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
        "rounded-2xl transition-all duration-200 border border-[#D8E6DA]",
        glass ? "glass-panel" : "bg-[#FBF8F2]",
        hoverEffect ? "hover:shadow-md hover:border-[#007F68]/40" : "shadow-xs",
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
      <div className={clsx("p-5 border-b border-[#D8E6DA]/70 flex items-start justify-between gap-4", className)}>
        <div>
          {title && <h3 className="text-base font-semibold text-[#103342]">{title}</h3>}
          {subtitle && <p className="text-xs text-[#294B57] mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
  return <div className={clsx("p-5 border-b border-[#D8E6DA]/70", className)}>{children}</div>;
}

export function CardBody({ children, className = '' }) {
  return <div className={clsx("p-5 text-[#294B57]", className)}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return <div className={clsx("p-4 bg-[#F0EBE1]/60 border-t border-[#D8E6DA]/70 rounded-b-2xl", className)}>{children}</div>;
}
