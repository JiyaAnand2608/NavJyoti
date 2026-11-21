import React from 'react';

export function KidzyRobot({ responding = false, compact = false, waving = false }) {
  return (
    <svg
      viewBox="0 0 120 132"
      role="img"
      aria-label="Kidzy, your friendly child-health robot"
      className={`kidzy-robot ${compact ? 'kidzy-robot-compact' : ''} ${responding ? 'kidzy-robot-responding' : ''} ${waving ? 'kidzy-robot-waving' : ''}`}
    >
      <defs>
        <linearGradient id="kidzy-shell" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#F8FFF8" />
          <stop offset="1" stopColor="#B8E2C6" />
        </linearGradient>
        <linearGradient id="kidzy-face" x1="0" x2="0.9" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E4F4E8" />
        </linearGradient>
        <linearGradient id="kidzy-body" x1="0" x2="0.9" y1="0" y2="1">
          <stop offset="0" stopColor="#DDF0E3" />
          <stop offset="1" stopColor="#A8D5B5" />
        </linearGradient>
        <filter id="kidzy-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#103342" floodOpacity=".16" />
        </filter>
      </defs>

      <g className="kidzy-robot-float" filter="url(#kidzy-shadow)">
        <path d="M60 14V8" stroke="#718F83" strokeWidth="4" strokeLinecap="round" />
        <circle className="kidzy-antenna-tip" cx="60" cy="6" r="5" fill="#F4B83F" />
        <path className="kidzy-arm" d="M21 57H14C9 57 7 61 7 67s3 10 8 10h7" fill="#A8D5B5" stroke="#83B996" strokeWidth="2" />
        <g className="kidzy-wave-arm">
          <path className="kidzy-arm" d="M99 57h7c5 0 7 4 7 10s-3 10-8 10h-7" fill="#A8D5B5" stroke="#83B996" strokeWidth="2" />
          <circle cx="107" cy="69" r="3" fill="#F8FFF8" />
        </g>
        <circle cx="13" cy="69" r="3" fill="#F8FFF8" />

        <rect x="22" y="23" width="76" height="65" rx="25" fill="url(#kidzy-shell)" stroke="#83B996" strokeWidth="2" />
        <path d="M30 48c0-15 10-23 23-23h15c13 0 22 8 22 23v12c0 12-9 20-22 20H52c-13 0-22-8-22-20z" fill="url(#kidzy-face)" />
        <ellipse cx="46" cy="55" rx="6" ry="8" fill="#103342" className="kidzy-eye" />
        <ellipse cx="74" cy="55" rx="6" ry="8" fill="#103342" className="kidzy-eye" />
        <circle cx="48" cy="52" r="2" fill="#FFFFFF" />
        <circle cx="76" cy="52" r="2" fill="#FFFFFF" />
        <path d="M53 68c4 5 10 5 14 0" fill="none" stroke="#007F68" strokeWidth="3" strokeLinecap="round" />
        <circle cx="37" cy="65" r="3" fill="#E8A6A1" opacity=".8" />
        <circle cx="83" cy="65" r="3" fill="#E8A6A1" opacity=".8" />

        <path d="M36 88v17c0 7 6 12 13 12h22c7 0 13-5 13-12V88" fill="url(#kidzy-body)" stroke="#83B996" strokeWidth="2" />
        <rect x="48" y="94" width="24" height="14" rx="7" fill="#FBF8F2" stroke="#A8D5B5" />
        <path d="M60 105s-5-3-5-6a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 3-5 6-5 6z" fill="#007F68" />
        <path d="M42 117v5m36-5v5" stroke="#718F83" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
