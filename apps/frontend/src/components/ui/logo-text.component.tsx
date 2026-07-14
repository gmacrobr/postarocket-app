import React from 'react';

// PostaRocket: wordmark oficial (foguete + PostaRocket)
export const LogoTextComponent = () => {
  return (
    <svg
      width="170"
      height="36"
      viewBox="0 0 520 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="prFire" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFC400" />
          <stop offset="45%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#E11D2E" />
        </linearGradient>
        <linearGradient id="prBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5A00" />
          <stop offset="100%" stopColor="#D9042B" />
        </linearGradient>
      </defs>
      <g transform="translate(52,56)">
        <line x1="-44" y1="28" x2="-19" y2="12" stroke="#FF6B00" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
        <line x1="-36" y1="42" x2="-15" y2="28" stroke="#E11D2E" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
        <g transform="rotate(45) scale(0.68)">
          <path d="M0,16 C10,28 8,44 0,60 C-8,44 -10,28 0,16 Z" fill="url(#prFire)" />
          <path d="M0,-46 C16,-28 19,-6 13,16 L-13,16 C-19,-6 -16,-28 0,-46 Z" fill="url(#prBody)" />
          <path d="M0,-46 C9,-36 13,-27 15,-18 L-15,-18 C-13,-27 -9,-36 0,-46 Z" fill="#FFFFFF" />
          <circle cx="0" cy="-4" r="9" fill="#FFFFFF" />
          <path d="M-13,0 L-30,24 L-13,19 Z" fill="#8E0E22" />
          <path d="M13,0 L30,24 L13,19 Z" fill="#8E0E22" />
        </g>
      </g>
      <text
        x="106"
        y="74"
        fontFamily="Poppins, 'Segoe UI', Arial, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="50"
      >
        <tspan fill="currentColor">Posta</tspan>
        <tspan fill="url(#prFire)">Rocket</tspan>
      </text>
    </svg>
  );
};
