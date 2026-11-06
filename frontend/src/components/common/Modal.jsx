import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#103342]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={clsx(
            "w-full transform overflow-hidden rounded-2xl bg-[#FBF8F2] text-left align-middle shadow-xl transition-all border border-[#D8E6DA]",
            maxWidth
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#D8E6DA]/70 p-5">
            <div>
              <h3 className="text-lg font-bold text-[#103342] font-serif">{title}</h3>
              {subtitle && <p className="text-xs text-[#294B57] mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#294B57] hover:bg-[#DDF0E3]/60 hover:text-[#103342] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 text-[#294B57]">{children}</div>
        </div>
      </div>
    </div>
  );
}
