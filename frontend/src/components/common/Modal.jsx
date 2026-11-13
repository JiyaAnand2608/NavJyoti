
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render outside the page layout to avoid parent blur effects.
  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto">

      {/* Blurred background overlay */}
      <div
        className="fixed inset-0 z-0 bg-[#103342]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popup positioning */}
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 pointer-events-none">

        {/* Sharp modal dialog */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={clsx(
            'relative w-full pointer-events-auto',
            'rounded-2xl bg-[#FBF8F2]',
            'text-left shadow-2xl',
            'border border-[#D8E6DA]',
            'max-h-[90vh] overflow-y-auto',
            maxWidth
          )}
          onClick={(e) => e.stopPropagation()}
        >

          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#D8E6DA]/70 p-5">

            <div>
              <h3 className="text-lg font-bold text-[#103342] font-serif">
                {title}
              </h3>

              {subtitle && (
                <p className="text-xs text-[#294B57] mt-1">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-[#294B57] hover:bg-[#DDF0E3]/60 hover:text-[#103342] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

          {/* Body */}
          <div className="p-6 text-[#294B57]">
            {children}
          </div>

        </div>
      </div>

    </div>,
    document.body
  );
}
