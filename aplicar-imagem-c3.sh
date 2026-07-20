#!/bin/bash
# ============================================================
# APLICAR-IMAGEM-C3.SH — Estúdio de IA · Geração de Imagens
#   - model ImageModel (seletor gerenciável de motores/tiers)
#   - método chargeCustom no CreditsService (débito exato)
#   - service (OpenAI GPT Image + salva no R2) + controller
#   - página frontend + item no menu
# Rodar na RAIZ do repositório, depois de C1 e C2.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório!"
[ -d imagem-src ] || falha "pasta imagem-src/ não encontrada!"
CS=libraries/nestjs-libraries/src/database/prisma/credits/credits.service.ts
[ -f "$CS" ] || falha "C1 (créditos) precisa estar aplicado antes!"

echo "=== 1/6 — Model no schema ==="
SCHEMA=libraries/nestjs-libraries/src/database/prisma/schema.prisma
if grep -q "model ImageModel" $SCHEMA; then ok "model já existe";
else cat imagem-src/schema-append.prisma >> $SCHEMA; ok "model ImageModel adicionado"; fi

echo "=== 2/6 — Método chargeCustom no CreditsService ==="
if grep -q "chargeCustom" "$CS"; then
  ok "chargeCustom já existe"
else
  python3 - <<'PYEOF'
cs='libraries/nestjs-libraries/src/database/prisma/credits/credits.service.ts'
c=open(cs).read()
snippet=open('imagem-src/chargeCustom-snippet.ts').read()
# inserir antes do último fechamento de classe (última chave })
idx=c.rstrip().rfind('}')
c=c[:idx]+snippet+'\n}'+c[idx+1:]
open(cs,'w').write(c)
print('  ✓ chargeCustom inserido no CreditsService')
PYEOF
fi

echo "=== 3/6 — Backend (service + controller) ==="
cp imagem-src/image.studio.service.ts libraries/nestjs-libraries/src/database/prisma/studio/
cp imagem-src/image.studio.controller.ts apps/backend/src/api/routes/
ok "arquivos copiados"

echo "=== 4/6 — Registrar service no database.module ==="
python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/database.module.ts'
c=open(p).read()
imp="import { ImageStudioService } from '@gitroom/nestjs-libraries/database/prisma/studio/image.studio.service';\n"
anchor="import { StudioService } from '@gitroom/nestjs-libraries/database/prisma/studio/studio.service';\n"
assert anchor in c, 'C2 nao encontrado'
if 'ImageStudioService' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    c=c.replace("    StudioService,\n", "    StudioService,\n    ImageStudioService,\n", 1)
open(p,'w').write(c); print('  ✓ ImageStudioService registrado')
PYEOF

echo "=== 5/6 — Registrar controller no api.module ==="
python3 - <<'PYEOF'
p='apps/backend/src/api/api.module.ts'
c=open(p).read()
imp="import { ImageStudioController } from '@gitroom/backend/api/routes/image.studio.controller';\n"
anchor="import { StudioController } from '@gitroom/backend/api/routes/studio.controller';\n"
assert anchor in c
if 'ImageStudioController' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    idx=c.index('controllers: ['); marker='    StudioController,\n'
    pos=c.index(marker, idx)
    c=c[:pos]+marker+'    ImageStudioController,\n'+c[pos+len(marker):]
    if 'const authenticatedController' in c:
        ac=c.index('const authenticatedController'); br=c.index('[', ac)
        c=c[:br+1]+'\n    ImageStudioController,'+c[br+1:]
open(p,'w').write(c); print('  ✓ ImageStudioController registrado (autenticado)')
PYEOF

echo "=== 6/6 — Frontend (página + menu) ==="
cp imagem-src/image.studio.component.tsx apps/frontend/src/components/studio/
mkdir -p "apps/frontend/src/app/(app)/(site)/estudio-imagens"
cat > "apps/frontend/src/app/(app)/(site)/estudio-imagens/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { ImageStudioComponent } from '@gitroom/frontend/components/studio/image.studio.component';
export const metadata: Metadata = { title: 'PostaRocket Estúdio de Imagens', description: '' };
export default async function Index() { return <ImageStudioComponent />; }
EOF
python3 - <<'PYEOF'
p='apps/frontend/src/components/layout/top.menu.tsx'
c=open(p).read()
ITEM="""    {
      name: t('estudio_imagens', 'Estúdio de Imagens'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="8.5" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/estudio-imagens',
    },
"""
anchor="      path: '/estudio',\n    },\n"
if "'/estudio-imagens'" not in c and anchor in c:
    c=c.replace(anchor, anchor+ITEM, 1); open(p,'w').write(c)
    print('  ✓ item Estúdio de Imagens adicionado ao menu')
else: print('  ✓ item já existe ou âncora ausente')
PYEOF

echo "=== 7/8 — Método findByReference (idempotência) ==="
CS=libraries/nestjs-libraries/src/database/prisma/credits/credits.service.ts
if grep -q "findByReference" "$CS"; then
  ok "findByReference já existe"
else
  python3 - <<'PYEOF2'
cs='libraries/nestjs-libraries/src/database/prisma/credits/credits.service.ts'
c=open(cs).read()
snippet=open('imagem-src/findByReference-snippet.ts').read()
idx=c.rstrip().rfind('}')
c=c[:idx]+snippet+'\n}'+c[idx+1:]
open(cs,'w').write(c)
print('  ✓ findByReference inserido')
PYEOF2
fi

echo "=== 8/8 — Ponte Control Rocket (rota de serviço) ==="
cp imagem-src/credits.service.controller.ts apps/backend/src/api/routes/
python3 - <<'PYEOF3'
p='apps/backend/src/api/api.module.ts'
c=open(p).read()
imp="import { CreditsServiceController } from '@gitroom/backend/api/routes/credits.service.controller';\n"
anchor="import { CreditsController } from '@gitroom/backend/api/routes/credits.controller';\n"
assert anchor in c
if 'CreditsServiceController' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    idx=c.index('controllers: ['); marker='    CreditsController,\n'
    pos=c.index(marker, idx)
    c=c[:pos]+marker+'    CreditsServiceController,\n'+c[pos+len(marker):]
    # NAO adicionar ao authenticatedController (rota de sistema, protegida por chave)
open(p,'w').write(c); print('  ✓ CreditsServiceController registrado (rota de sistema)')
PYEOF3

echo ""
echo "============================================================"
echo "🖼️ IMAGEM C3 APLICADO! Depois do build + deploy:"
echo "   1) adicionar IMAGE_API_KEY no compose (chave OpenAI)"
echo "   2) chamar POST /api/studio/image/admin/seed (cria os 3 tiers)"
echo "   docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "============================================================"
