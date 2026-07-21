#!/bin/bash
# ============================================================
# APLICAR-PEDIDOS-B4.SH — Solicitar Artes
#   - model LibraryRequest (com status e entrega)
#   - service + controller (cliente + admin)
#   - tela "Solicitar Artes" + item no menu
# Rodar na RAIZ do repositório, depois do B2. Fonte em ./b4-src.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório!"
[ -d b4-src ] || falha "pasta b4-src/ não encontrada!"
SCHEMA=libraries/nestjs-libraries/src/database/prisma/schema.prisma
grep -q "model LibraryMedia" $SCHEMA || falha "Biblioteca precisa estar aplicada antes!"

echo "=== 1/5 — Model no schema ==="
if grep -q "model LibraryRequest" $SCHEMA; then ok "model já existe";
else cat b4-src/schema-append.prisma >> $SCHEMA; ok "model LibraryRequest adicionado"; fi

echo "=== 2/5 — Backend (service + controller) ==="
cp b4-src/library.request.service.ts libraries/nestjs-libraries/src/database/prisma/library/
cp b4-src/library.request.controller.ts apps/backend/src/api/routes/
ok "arquivos copiados"

echo "=== 3/5 — Registrar service ==="
python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/database.module.ts'
c=open(p).read()
imp="import { LibraryRequestService } from '@gitroom/nestjs-libraries/database/prisma/library/library.request.service';\n"
anchor="import { LibraryService } from '@gitroom/nestjs-libraries/database/prisma/library/library.service';\n"
assert anchor in c
if 'LibraryRequestService' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    c=c.replace("    LibraryService,\n", "    LibraryService,\n    LibraryRequestService,\n", 1)
open(p,'w').write(c); print('  ✓ LibraryRequestService registrado')
PYEOF

echo "=== 4/5 — Registrar controller ==="
python3 - <<'PYEOF'
p='apps/backend/src/api/api.module.ts'
c=open(p).read()
imp="import { LibraryRequestController } from '@gitroom/backend/api/routes/library.request.controller';\n"
anchor="import { LibraryController } from '@gitroom/backend/api/routes/library.controller';\n"
assert anchor in c
if 'LibraryRequestController' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    idx=c.index('controllers: ['); marker='    LibraryController,\n'
    pos=c.index(marker, idx)
    c=c[:pos]+marker+'    LibraryRequestController,\n'+c[pos+len(marker):]
    if 'const authenticatedController' in c:
        ac=c.index('const authenticatedController'); br=c.index('[', ac)
        c=c[:br+1]+'\n    LibraryRequestController,'+c[br+1:]
open(p,'w').write(c); print('  ✓ LibraryRequestController registrado (autenticado)')
PYEOF

echo "=== 5/5 — Frontend (página + menu) ==="
cp b4-src/library.request.component.tsx apps/frontend/src/components/library/
mkdir -p "apps/frontend/src/app/(app)/(site)/solicitar-artes"
cat > "apps/frontend/src/app/(app)/(site)/solicitar-artes/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { LibraryRequestComponent } from '@gitroom/frontend/components/library/library.request.component';
export const metadata: Metadata = { title: 'PostaRocket Solicitar Artes', description: '' };
export default async function Index() { return <LibraryRequestComponent />; }
EOF
python3 - <<'PYEOF'
p='apps/frontend/src/components/layout/top.menu.tsx'
c=open(p).read()
ITEM="""    {
      name: t('solicitar_artes', 'Solicitar Artes'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 24 24" fill="none">
          <path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 10h6M9 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      path: '/solicitar-artes',
    },
"""
anchor="      path: '/minha-marca',\n    },\n"
if "'/solicitar-artes'" not in c and anchor in c:
    c=c.replace(anchor, anchor+ITEM, 1); open(p,'w').write(c)
    print('  ✓ item Solicitar Artes adicionado ao menu')
else: print('  ✓ item já existe ou âncora ausente')
PYEOF

echo ""
echo "============================================================"
echo "📮 PEDIDOS B4 APLICADO! Reconstruir:"
echo "   nohup docker build -t postarocket-app:v1 -f Dockerfile.dev . > /tmp/build.log 2>&1 &"
echo "============================================================"
