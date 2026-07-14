#!/bin/bash
# ============================================================
# APLICAR-POSTAROCKET-V1.2.SH
#   1) Português como idioma PADRÃO (fallback do i18n)
#   2) Bandeira do Brasil 🇧🇷 no seletor de idiomas
#   3) Tela de login redesenhada com a identidade PostaRocket
# Rodar na RAIZ do repositório, depois dos patches v1 e v1.1
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório postarocket-app!"

echo "=== 1/3 — Português como idioma padrão ==="
cat > libraries/react-shared-libraries/src/translation/i18n.config.ts <<'EOF'
// PostaRocket: português como idioma padrão da instância
export const fallbackLng = 'pt';
export const languages = [
  fallbackLng,
  'en',
  'he',
  'ru',
  'zh',
  'fr',
  'es',
  'de',
  'it',
  'ja',
  'ko',
  'ar',
  'tr',
  'vi',
];

export const defaultNS = 'translation';
export const cookieName = 'i18next';
export const headerName = 'x-i18next-current-language';
EOF
ok "fallback do i18n agora é 'pt' (inglês continua disponível no seletor)"

echo "=== 2/3 — Bandeira do Brasil no seletor ==="
F=apps/frontend/src/components/layout/language.component.tsx
grep -q "return 'BR'" $F || sed -i "s|if (languageCode === 'en') return 'GB';|if (languageCode === 'en') return 'GB';\n  if (languageCode === 'pt') return 'BR';|" $F
grep -q "return 'BR'" $F || falha "não consegui inserir a bandeira BR"
ok "idioma 'pt' agora exibe a bandeira 🇧🇷"

echo "=== 3/3 — Tela de login PostaRocket ==="
cat > "apps/frontend/src/app/(app)/auth/layout.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';
const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));

const fire = {
  backgroundImage: 'linear-gradient(135deg,#FFC400 0%,#FF6B00 45%,#E11D2E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
} as const;

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="bg-[#0D0517] flex flex-1 p-[12px] gap-[12px] min-h-screen w-screen text-white">
      <style>{`
        @keyframes prFly {0%,100%{transform:translate(0,0)}50%{transform:translate(10px,-14px)}}
        @keyframes prTw {0%,100%{opacity:.25}50%{opacity:.95}}
      `}</style>
      <ReturnUrlComponent />

      {/* Painel do formulário */}
      <div className="flex flex-col py-[40px] px-[20px] flex-1 lg:w-[600px] lg:flex-none rounded-[16px] text-white p-[12px] bg-[#1A0D2B] border border-[#FF6B00]/20">
        <div className="w-full max-w-[440px] mx-auto justify-center gap-[20px] h-full flex flex-col text-white">
          <LogoTextComponent />
          <div className="flex">{children}</div>
        </div>
      </div>

      {/* Painel da marca */}
      <div className="flex-1 hidden lg:flex flex-col items-center justify-center relative overflow-hidden rounded-[16px]">
        {/* estrelas */}
        {[
          [8, 12, 3, '#FFC400'], [22, 78, 2, '#FF6B00'], [35, 25, 2.5, '#E11D2E'],
          [55, 85, 2, '#FFFFFF'], [68, 15, 3, '#FFC400'], [82, 60, 2, '#FF6B00'],
          [90, 30, 2.5, '#FFFFFF'], [15, 55, 2, '#FFFFFF'], [45, 65, 2, '#E11D2E'],
          [75, 88, 2.5, '#FFC400'], [60, 40, 1.5, '#FFFFFF'], [30, 92, 2, '#FF6B00'],
        ].map(([x, y, r, c], i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${r}px`,
              height: `${r}px`,
              background: c as string,
              animation: `prTw 3.5s ease-in-out ${(i * 0.35) % 3}s infinite`,
            }}
          />
        ))}

        {/* foguete */}
        <div style={{ animation: 'prFly 3.2s ease-in-out infinite' }}>
          <svg width="220" height="220" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lgF" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFC400" /><stop offset="45%" stopColor="#FF6B00" /><stop offset="100%" stopColor="#E11D2E" />
              </linearGradient>
              <linearGradient id="lgB" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF5A00" /><stop offset="100%" stopColor="#D9042B" />
              </linearGradient>
            </defs>
            <g transform="translate(128,112)">
              <line x1="-92" y1="64" x2="-38" y2="28" stroke="#FF6B00" strokeWidth="8" strokeLinecap="round" opacity="0.9" />
              <line x1="-74" y1="92" x2="-28" y2="62" stroke="#E11D2E" strokeWidth="6" strokeLinecap="round" opacity="0.65" />
              <line x1="-96" y1="30" x2="-60" y2="8" stroke="#FFC400" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
              <g transform="rotate(45) scale(1.5)">
                <path d="M0,16 C10,28 8,44 0,60 C-8,44 -10,28 0,16 Z" fill="url(#lgF)" />
                <path d="M0,20 C5,28 4,38 0,48 C-4,38 -5,28 0,20 Z" fill="#FFE486" />
                <path d="M0,-46 C16,-28 19,-6 13,16 L-13,16 C-19,-6 -16,-28 0,-46 Z" fill="url(#lgB)" />
                <path d="M0,-46 C9,-36 13,-27 15,-18 L-15,-18 C-13,-27 -9,-36 0,-46 Z" fill="#FFFFFF" />
                <g transform="translate(0,-4)">
                  <circle cx="0" cy="0" r="9" fill="#FFFFFF" />
                  <path d="M -4.5 7 L -8 13 L -0.5 8.4 Z" fill="#FFFFFF" />
                  <line x1="-4" y1="-2.4" x2="4" y2="-2.4" stroke="#D9042B" strokeWidth="2.2" strokeLinecap="round" />
                  <line x1="-4" y1="1.8" x2="1.5" y2="1.8" stroke="#D9042B" strokeWidth="2.2" strokeLinecap="round" />
                </g>
                <path d="M-13,0 L-30,24 L-13,19 Z" fill="#8E0E22" />
                <path d="M13,0 L30,24 L13,19 Z" fill="#8E0E22" />
              </g>
            </g>
          </svg>
        </div>

        {/* texto */}
        <div className="text-center mt-[10px] px-[40px]">
          <div className="text-[44px] font-[900] italic leading-[1.1]">
            Seu post em <span style={fire}>órbita.</span>
          </div>
          <div className="text-[18px] text-[#B8A9CF] mt-[14px]">
            Escreva uma vez. Publique em todas as redes.
          </div>
          <div className="flex flex-col items-start gap-[10px] mt-[28px] mx-auto w-fit text-[15px] text-[#EADFF9]">
            <div>📅 Calendário visual multicanal</div>
            <div>🤖 IA que cria, ilustra e agenda por você</div>
            <div>📊 Resultados de todas as redes em um painel</div>
          </div>
        </div>
      </div>
    </div>
  );
}
EOF
ok "tela de login redesenhada (foguete animado, estrelas e texto em português)"

echo ""
echo "============================================================"
echo "🚀 V1.2 APLICADO! Reconstruir a imagem:"
echo "   docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "============================================================"
