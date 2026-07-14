#!/bin/bash
# ============================================================
# APLICAR-POSTAROCKET-V1.1.SH — Caça aos logos embutidos
# Rodar na RAIZ do repositório, DEPOIS do aplicar-postarocket.sh
#   1) Substitui o wordmark inline (logo-text.component.tsx)
#   2) Substitui o ícone da sidebar (new-layout/logo.tsx)
#   3) Troca as cores roxas/rosa hardcoded restantes nos TSX
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }

[ -f Dockerfile.dev ] && [ -d apps/frontend ] || falha "Rode na RAIZ do repositório postarocket-app!"

echo "=== 1/3 — Wordmark da tela de login (logo-text.component.tsx) ==="
cat > apps/frontend/src/components/ui/logo-text.component.tsx <<'EOF'
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
EOF
ok "wordmark PostaRocket instalado"

echo "=== 2/3 — Ícone da sidebar (new-layout/logo.tsx) ==="
cat > apps/frontend/src/components/new-layout/logo.tsx <<'EOF'
'use client';

// PostaRocket: ícone oficial (foguete em disparada)
export const Logo = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="60"
      height="60"
      viewBox="0 0 64 64"
      fill="none"
      className="mt-[8px] min-w-[60px] min-h-[60px]"
    >
      <defs>
        <linearGradient id="prIcFire" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFC400" />
          <stop offset="50%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#E11D2E" />
        </linearGradient>
        <linearGradient id="prIcBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5A00" />
          <stop offset="100%" stopColor="#D9042B" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#12081C" />
      <g transform="translate(33,31) rotate(45) scale(0.42)">
        <path d="M0,18 C13,32 10,50 0,68 C-10,50 -13,32 0,18 Z" fill="url(#prIcFire)" />
        <path d="M0,-50 C19,-30 22,-6 15,18 L-15,18 C-22,-6 -19,-30 0,-50 Z" fill="url(#prIcBody)" />
        <path d="M0,-50 C11,-39 15,-29 17,-20 L-17,-20 C-15,-29 -11,-39 0,-50 Z" fill="#FFFFFF" />
        <circle cx="0" cy="-4" r="11" fill="#FFFFFF" />
        <path d="M-15,2 L-34,28 L-15,22 Z" fill="#8E0E22" />
        <path d="M15,2 L34,28 L15,22 Z" fill="#8E0E22" />
      </g>
    </svg>
  );
};
EOF
ok "ícone da sidebar agora é o foguete"

echo "=== 3/3 — Cores hardcoded restantes (roxo/rosa -> fogo) ==="
ARQUIVOS=$(grep -rl "#FC69FF\|#fc69ff\|#612BD3\|#612bd3\|#612AD5\|#612ad5" apps/frontend/src libraries/react-shared-libraries --include="*.tsx" --include="*.ts" --include="*.scss" 2>/dev/null || true)
if [ -n "$ARQUIVOS" ]; then
  echo "$ARQUIVOS" | xargs sed -i 's/#FC69FF/#FF6B00/gI; s/#612BD3/#FF6B00/gI; s/#612AD5/#FF6B00/gI'
  ok "cores trocadas em: $(echo "$ARQUIVOS" | wc -l) arquivo(s)"
else
  ok "nenhuma cor hardcoded restante (já limpo)"
fi

echo ""
echo "============================================================"
echo "🚀 V1.1 APLICADO! Reconstruir a imagem (usa cache, ~5-10 min):"
echo "   docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "============================================================"
