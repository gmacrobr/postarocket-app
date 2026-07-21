#!/bin/bash
# ============================================================
# APLICAR-FLYER-C4.SH — Estúdio de Flyers
#   - service (IA estrutura o flyer em JSON) + débito 30 créditos
#   - controller
#   - tela com composição em canvas usando o Kit de Marca
#   - item no menu
# Rodar na RAIZ do repositório, depois de C1/C2 e B3.1.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório!"
[ -d c4-src ] || falha "pasta c4-src/ não encontrada!"
[ -f libraries/nestjs-libraries/src/database/prisma/credits/credits.service.ts ] || falha "C1 (créditos) necessário!"
[ -f libraries/nestjs-libraries/src/database/prisma/brandkit/brandkit.service.ts ] || falha "B3.1 (Kit de Marca) necessário!"

echo "=== 1/4 — Backend (service + controller) ==="
cp c4-src/flyer.studio.service.ts libraries/nestjs-libraries/src/database/prisma/studio/
cp c4-src/flyer.studio.controller.ts apps/backend/src/api/routes/
ok "arquivos copiados"

echo "=== 2/4 — Registrar service ==="
python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/database.module.ts'
c=open(p).read()
imp="import { FlyerStudioService } from '@gitroom/nestjs-libraries/database/prisma/studio/flyer.studio.service';\n"
anchor="import { StudioService } from '@gitroom/nestjs-libraries/database/prisma/studio/studio.service';\n"
assert anchor in c, 'C2 nao encontrado'
if 'FlyerStudioService' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    c=c.replace("    StudioService,\n", "    StudioService,\n    FlyerStudioService,\n", 1)
open(p,'w').write(c); print('  ✓ FlyerStudioService registrado')
PYEOF

echo "=== 3/4 — Registrar controller ==="
python3 - <<'PYEOF'
p='apps/backend/src/api/api.module.ts'
c=open(p).read()
imp="import { FlyerStudioController } from '@gitroom/backend/api/routes/flyer.studio.controller';\n"
anchor="import { StudioController } from '@gitroom/backend/api/routes/studio.controller';\n"
assert anchor in c
if 'FlyerStudioController' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    idx=c.index('controllers: ['); marker='    StudioController,\n'
    pos=c.index(marker, idx)
    c=c[:pos]+marker+'    FlyerStudioController,\n'+c[pos+len(marker):]
    if 'const authenticatedController' in c:
        ac=c.index('const authenticatedController'); br=c.index('[', ac)
        c=c[:br+1]+'\n    FlyerStudioController,'+c[br+1:]
open(p,'w').write(c); print('  ✓ FlyerStudioController registrado (autenticado)')
PYEOF

echo "=== 4/4 — Frontend (página + menu) ==="
cp c4-src/flyer.studio.component.tsx apps/frontend/src/components/studio/
mkdir -p "apps/frontend/src/app/(app)/(site)/estudio-flyers"
cat > "apps/frontend/src/app/(app)/(site)/estudio-flyers/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { FlyerStudioComponent } from '@gitroom/frontend/components/studio/flyer.studio.component';
export const metadata: Metadata = { title: 'PostaRocket Estúdio de Flyers', description: '' };
export default async function Index() { return <FlyerStudioComponent />; }
EOF
python3 - <<'PYEOF'
p='apps/frontend/src/components/layout/top.menu.tsx'
c=open(p).read()
ITEM="""    {
      name: t('estudio_flyers', 'Estúdio de Flyers'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 24 24" fill="none">
          <path d="M6 3h9l4 4v14H6V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M14 3v5h5M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      path: '/estudio-flyers',
    },
"""
anchor="      path: '/estudio-imagens',\n    },\n"
if "'/estudio-flyers'" not in c and anchor in c:
    c=c.replace(anchor, anchor+ITEM, 1); open(p,'w').write(c)
    print('  ✓ item Estúdio de Flyers adicionado ao menu')
else: print('  ✓ item já existe ou âncora ausente')
PYEOF

echo ""
echo "============================================================"
echo "📄 FLYERS C4 APLICADO! Reconstruir:"
echo "   nohup docker build -t postarocket-app:v1 -f Dockerfile.dev . > /tmp/build.log 2>&1 &"
echo "============================================================"
