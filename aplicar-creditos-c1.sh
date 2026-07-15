#!/bin/bash
# ============================================================
# APLICAR-CREDITOS-C1.SH — Estúdio de IA · Carteira (fundação)
#   - models Prisma (wallet, transaction, package, action price)
#   - service com débito ATÔMICO + estorno
#   - controller (cliente + admin)
#   - página frontend "Meus Créditos"
#   - item no menu (após Biblioteca)
# Rodar na RAIZ do repositório. Fonte em ./creditos-src (no zip).
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório postarocket-app!"
[ -d creditos-src ] || falha "pasta creditos-src/ não encontrada!"

echo "=== 1/6 — Models no schema ==="
SCHEMA=libraries/nestjs-libraries/src/database/prisma/schema.prisma
if grep -q "model CreditWallet" $SCHEMA; then ok "models já existem";
else cat creditos-src/schema-append.prisma >> $SCHEMA; ok "4 models adicionados"; fi

echo "=== 2/6 — Relação no model Organization ==="
python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/schema.prisma'
c=open(p).read()
if 'creditWallet' not in c:
    import re
    # inserir campo de relação antes do fechamento do model Organization
    m=re.search(r'(model Organization \{.*?)(\n\})', c, re.S)
    assert m, 'model Organization nao encontrado'
    c=c[:m.end(1)] + '\n  creditWallet          CreditWallet?' + c[m.end(1):]
    open(p,'w').write(c)
    print('  ✓ relação creditWallet adicionada ao Organization')
else:
    print('  ✓ relação já existe')
PYEOF

echo "=== 3/6 — Backend (service + controller) ==="
mkdir -p libraries/nestjs-libraries/src/database/prisma/credits
cp creditos-src/credits.service.ts libraries/nestjs-libraries/src/database/prisma/credits/
cp creditos-src/credits.controller.ts apps/backend/src/api/routes/
ok "arquivos backend copiados"

echo "=== 4/6 — Registrar no database.module ==="
python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/database.module.ts'
c=open(p).read()
imp="import { CreditsService } from '@gitroom/nestjs-libraries/database/prisma/credits/credits.service';\n"
anchor="import { MediaService } from '@gitroom/nestjs-libraries/database/prisma/media/media.service';\n"
assert anchor in c
if 'CreditsService' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    c=c.replace("    MediaService,\n", "    MediaService,\n    CreditsService,\n", 1)
open(p,'w').write(c)
print('  ✓ CreditsService registrado')
PYEOF

echo "=== 5/6 — Registrar controller (autenticado) no api.module ==="
python3 - <<'PYEOF'
p='apps/backend/src/api/api.module.ts'
c=open(p).read()
imp="import { CreditsController } from '@gitroom/backend/api/routes/credits.controller';\n"
anchor="import { AuthController } from '@gitroom/backend/api/routes/auth.controller';\n"
assert anchor in c
if 'CreditsController' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    idx=c.index('controllers: [')
    marker='    AuthController,\n'
    pos=c.index(marker, idx)
    c=c[:pos]+marker+'    CreditsController,\n'+c[pos+len(marker):]
    if 'const authenticatedController' in c:
        ac=c.index('const authenticatedController'); br=c.index('[', ac)
        c=c[:br+1]+'\n    CreditsController,'+c[br+1:]
open(p,'w').write(c)
print('  ✓ CreditsController registrado (autenticado)')
PYEOF

echo "=== 6/6 — Frontend (página + menu) ==="
mkdir -p apps/frontend/src/components/credits
cp creditos-src/credits.component.tsx apps/frontend/src/components/credits/
mkdir -p "apps/frontend/src/app/(app)/(site)/creditos"
cat > "apps/frontend/src/app/(app)/(site)/creditos/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { CreditsComponent } from '@gitroom/frontend/components/credits/credits.component';
export const metadata: Metadata = { title: 'PostaRocket Créditos', description: '' };
export default async function Index() { return <CreditsComponent />; }
EOF
# item no menu (após /biblioteca)
python3 - <<'PYEOF'
p='apps/frontend/src/components/layout/top.menu.tsx'
c=open(p).read()
ITEM="""    {
      name: t('creditos', 'Créditos'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 24 24" fill="none">
          <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 7l2-3h14l2 3M16 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      path: '/creditos',
    },
"""
anchor="      path: '/biblioteca',\n    },\n"
if "'/creditos'" not in c and anchor in c:
    c=c.replace(anchor, anchor+ITEM, 1)
    open(p,'w').write(c)
    print('  ✓ item Créditos adicionado ao menu')
else:
    print('  ✓ item já existe ou âncora ausente')
PYEOF

echo ""
echo "============================================================"
echo "💰 CRÉDITOS C1 APLICADO! Depois do build + deploy:"
echo "   1) chame POST /api/credits/admin/seed (superadmin) p/ criar pacotes"
echo "   2) docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "============================================================"
