#!/bin/bash
# ============================================================
# APLICAR-ESTUDIO-C2.SH — Estúdio de IA · Copy especializada
#   - service com 9 prompts-mestre (reaproveita OpenRouter/Claude)
#   - débito de créditos por geração + estorno em falha
#   - controller + página frontend + item no menu
# Rodar na RAIZ do repositório, depois do C1. Fonte em ./estudio-src.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório!"
[ -d estudio-src ] || falha "pasta estudio-src/ não encontrada!"
grep -q "class CreditsService" libraries/nestjs-libraries/src/database/prisma/credits/credits.service.ts 2>/dev/null || falha "C1 (créditos) precisa estar aplicado antes!"

echo "=== 1/4 — Backend (service + controller) ==="
mkdir -p libraries/nestjs-libraries/src/database/prisma/studio
cp estudio-src/studio.service.ts libraries/nestjs-libraries/src/database/prisma/studio/
cp estudio-src/studio.controller.ts apps/backend/src/api/routes/
ok "arquivos copiados"

echo "=== 2/4 — Registrar service no database.module ==="
python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/database.module.ts'
c=open(p).read()
imp="import { StudioService } from '@gitroom/nestjs-libraries/database/prisma/studio/studio.service';\n"
anchor="import { CreditsService } from '@gitroom/nestjs-libraries/database/prisma/credits/credits.service';\n"
assert anchor in c, 'C1 nao encontrado no module'
if 'StudioService' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    c=c.replace("    CreditsService,\n", "    CreditsService,\n    StudioService,\n", 1)
open(p,'w').write(c); print('  ✓ StudioService registrado')
PYEOF

echo "=== 3/4 — Registrar controller (autenticado) no api.module ==="
python3 - <<'PYEOF'
p='apps/backend/src/api/api.module.ts'
c=open(p).read()
imp="import { StudioController } from '@gitroom/backend/api/routes/studio.controller';\n"
anchor="import { CreditsController } from '@gitroom/backend/api/routes/credits.controller';\n"
assert anchor in c, 'C1 controller nao encontrado'
if 'StudioController' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    idx=c.index('controllers: ['); marker='    CreditsController,\n'
    pos=c.index(marker, idx)
    c=c[:pos]+marker+'    StudioController,\n'+c[pos+len(marker):]
    if 'const authenticatedController' in c:
        ac=c.index('const authenticatedController'); br=c.index('[', ac)
        c=c[:br+1]+'\n    StudioController,'+c[br+1:]
open(p,'w').write(c); print('  ✓ StudioController registrado (autenticado)')
PYEOF

echo "=== 4/4 — Frontend (página + menu) ==="
mkdir -p apps/frontend/src/components/studio
cp estudio-src/studio.component.tsx apps/frontend/src/components/studio/
mkdir -p "apps/frontend/src/app/(app)/(site)/estudio"
cat > "apps/frontend/src/app/(app)/(site)/estudio/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { StudioComponent } from '@gitroom/frontend/components/studio/studio.component';
export const metadata: Metadata = { title: 'PostaRocket Estúdio de IA', description: '' };
export default async function Index() { return <StudioComponent />; }
EOF
python3 - <<'PYEOF'
p='apps/frontend/src/components/layout/top.menu.tsx'
c=open(p).read()
ITEM="""    {
      name: t('estudio', 'Estúdio de IA'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 24 24" fill="none">
          <path d="M12 3l1.9 4.8L19 9.5l-4 3.4 1.3 5.1L12 15.3 7.7 18l1.3-5.1-4-3.4 5.1-1.7L12 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/estudio',
    },
"""
anchor="      path: '/creditos',\n    },\n"
if "'/estudio'" not in c and anchor in c:
    c=c.replace(anchor, anchor+ITEM, 1); open(p,'w').write(c)
    print('  ✓ item Estúdio de IA adicionado ao menu')
else: print('  ✓ item já existe ou âncora ausente')
PYEOF

echo ""
echo "============================================================"
echo "✍️ ESTÚDIO C2 APLICADO! Reconstruir:"
echo "   docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "============================================================"
