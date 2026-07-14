#!/bin/bash
# ============================================================
# APLICAR-POSTAROCKET-V1.5.SH — Menus Biblioteca 📚 e Suporte 🛟
#   1) Item "Biblioteca" no menu (após Mídia) + página "Em breve"
#   2) Item "Suporte" no menu (antes de Configurações) + página
#      "Em breve" — quando o Help Desk estiver pronto, trocar o
#      path '/suporte' pela URL externa (abre em nova aba sozinho)
# Rodar na RAIZ do repositório, depois dos patches anteriores.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório postarocket-app!"

echo "=== 1/3 — Itens no menu lateral ==="
python3 - <<'PYEOF'
p = 'apps/frontend/src/components/layout/top.menu.tsx'
c = open(p).read()

BIBLIOTECA = """    {
      name: t('biblioteca', 'Biblioteca'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM9 7h7M9 11h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      path: '/biblioteca',
    },
"""

SUPORTE = """    {
      name: t('suporte', 'Suporte'),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4.93 4.93l3.39 3.39M15.68 15.68l3.39 3.39M15.68 8.32l3.39-3.39M4.93 19.07l3.39-3.39"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      path: '/suporte',
    },
"""

# Biblioteca: logo após o item /media
anchor_media = "      path: '/media',\n    },\n"
assert anchor_media in c, 'ancora do item /media nao encontrada'
if "'/biblioteca'" not in c:
    c = c.replace(anchor_media, anchor_media + BIBLIOTECA, 1)

# Suporte: logo antes do item Configuracoes
anchor_settings = "    {\n      name: t('settings', 'Settings'),"
assert anchor_settings in c, 'ancora do item settings nao encontrada'
if "'/suporte'" not in c:
    c = c.replace(anchor_settings, SUPORTE + anchor_settings, 1)

open(p, 'w').write(c)
print("  ✓ itens Biblioteca e Suporte adicionados ao menu")
PYEOF

echo "=== 2/3 — Página da Biblioteca (Em breve) ==="
mkdir -p "apps/frontend/src/app/(app)/(site)/biblioteca"
cat > "apps/frontend/src/app/(app)/(site)/biblioteca/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PostaRocket Biblioteca',
  description: '',
};

const fire = {
  backgroundImage:
    'linear-gradient(135deg,#FFC400 0%,#FF6B00 45%,#E11D2E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
} as const;

export default async function Index() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[70vh] text-center px-[24px]">
      <div className="text-[64px] mb-[8px]">📚</div>
      <div className="text-[38px] font-[900] italic leading-[1.1]">
        Biblioteca <span style={fire}>Rocket</span>
      </div>
      <span
        className="mt-[16px] text-[12px] font-[700] tracking-[0.2em] uppercase px-[16px] py-[6px] rounded-full border"
        style={{ color: '#FF8A3D', borderColor: 'rgba(255,107,0,.45)' }}
      >
        🚀 Em breve
      </span>
      <div className="mt-[22px] max-w-[560px] text-[15px]" style={{ color: '#B8A9CF' }}>
        Estamos preparando um arsenal completo para o seu conteúdo decolar:
        biblioteca de imagens e vídeos por segmento, anúncios prontos para
        editar e aprovar, e agendas completas por nicho — tudo com a sua marca
        aplicada automaticamente.
      </div>
    </div>
  );
}
EOF
ok "página /biblioteca criada"

echo "=== 3/3 — Página do Suporte (Em breve) ==="
mkdir -p "apps/frontend/src/app/(app)/(site)/suporte"
cat > "apps/frontend/src/app/(app)/(site)/suporte/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PostaRocket Suporte',
  description: '',
};

const fire = {
  backgroundImage:
    'linear-gradient(135deg,#FFC400 0%,#FF6B00 45%,#E11D2E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
} as const;

export default async function Index() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[70vh] text-center px-[24px]">
      <div className="text-[64px] mb-[8px]">🛟</div>
      <div className="text-[38px] font-[900] italic leading-[1.1]">
        Central de <span style={fire}>Suporte</span>
      </div>
      <span
        className="mt-[16px] text-[12px] font-[700] tracking-[0.2em] uppercase px-[16px] py-[6px] rounded-full border"
        style={{ color: '#FF8A3D', borderColor: 'rgba(255,107,0,.45)' }}
      >
        🚀 Em breve
      </span>
      <div className="mt-[22px] max-w-[560px] text-[15px]" style={{ color: '#B8A9CF' }}>
        Nossa central de ajuda está em construção. Em breve você abrirá
        chamados, acompanhará solicitações e encontrará tutoriais completos —
        tudo por aqui.
      </div>
    </div>
  );
}
EOF
ok "página /suporte criada"

echo ""
echo "============================================================"
echo "🚀 V1.5 APLICADO! Reconstruir a imagem:"
echo "   docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "============================================================"
