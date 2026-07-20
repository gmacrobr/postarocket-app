#!/bin/bash
# ============================================================
# APLICAR-BIBLIOTECA-B2.SH — Hierarquia 3 níveis + Packs
#   - models LibrarySegment / LibraryCategory / LibraryPack
#   - campos novos em LibraryMedia (segmento, categoria, pack,
#     resolução, orientação, aprovação)
#   - service + controller (hierarquia, packs, massa)
#   - nova tela da Biblioteca (galeria + packs + admin)
# Rodar na RAIZ do repositório, depois do B1. Fonte em ./b2-src.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório!"
[ -d b2-src ] || falha "pasta b2-src/ não encontrada!"
SCHEMA=libraries/nestjs-libraries/src/database/prisma/schema.prisma
grep -q "model LibraryMedia" $SCHEMA || falha "B1 (Biblioteca) precisa estar aplicado antes!"

echo "=== 1/6 — Models novos no schema ==="
if grep -q "model LibrarySegment" $SCHEMA; then ok "models já existem";
else cat b2-src/schema-append.prisma >> $SCHEMA; ok "3 models adicionados"; fi

echo "=== 2/6 — Campos novos em LibraryMedia ==="
python3 - <<'PYEOF'
import re
p='libraries/nestjs-libraries/src/database/prisma/schema.prisma'
c=open(p).read()
if 'orientation' in c and 'approval' in c:
    print('  ✓ campos já existem')
else:
    campos=open('b2-src/media-fields.prisma').read()
    m=re.search(r'(model LibraryMedia \{.*?)(\n\s*@@index)', c, re.S)
    assert m, 'model LibraryMedia nao encontrado'
    c=c[:m.end(1)]+'\n'+campos.rstrip()+c[m.end(1):]
    open(p,'w').write(c)
    print('  ✓ 8 campos adicionados ao LibraryMedia')
PYEOF

echo "=== 3/6 — Backend (service + controller) ==="
cp b2-src/library.tree.service.ts libraries/nestjs-libraries/src/database/prisma/library/
cp b2-src/library.tree.controller.ts apps/backend/src/api/routes/
ok "arquivos copiados"

echo "=== 4/6 — Registrar service ==="
python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/database.module.ts'
c=open(p).read()
imp="import { LibraryTreeService } from '@gitroom/nestjs-libraries/database/prisma/library/library.tree.service';\n"
anchor="import { LibraryService } from '@gitroom/nestjs-libraries/database/prisma/library/library.service';\n"
assert anchor in c, 'B1 nao encontrado no module'
if 'LibraryTreeService' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    c=c.replace("    LibraryService,\n", "    LibraryService,\n    LibraryTreeService,\n", 1)
open(p,'w').write(c); print('  ✓ LibraryTreeService registrado')
PYEOF

echo "=== 5/6 — Registrar controller ==="
python3 - <<'PYEOF'
p='apps/backend/src/api/api.module.ts'
c=open(p).read()
imp="import { LibraryTreeController } from '@gitroom/backend/api/routes/library.tree.controller';\n"
anchor="import { LibraryController } from '@gitroom/backend/api/routes/library.controller';\n"
assert anchor in c, 'B1 controller nao encontrado'
if 'LibraryTreeController' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    idx=c.index('controllers: ['); marker='    LibraryController,\n'
    pos=c.index(marker, idx)
    c=c[:pos]+marker+'    LibraryTreeController,\n'+c[pos+len(marker):]
    if 'const authenticatedController' in c:
        ac=c.index('const authenticatedController'); br=c.index('[', ac)
        c=c[:br+1]+'\n    LibraryTreeController,'+c[br+1:]
open(p,'w').write(c); print('  ✓ LibraryTreeController registrado (autenticado)')
PYEOF

echo "=== 6/6 — Frontend (nova tela) ==="
cp b2-src/library.b2.component.tsx apps/frontend/src/components/library/
cat > "apps/frontend/src/app/(app)/(site)/biblioteca/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { LibraryB2Component } from '@gitroom/frontend/components/library/library.b2.component';
export const metadata: Metadata = { title: 'PostaRocket Biblioteca', description: '' };
export default async function Index() { return <LibraryB2Component />; }
EOF
ok "página /biblioteca agora usa a versão B2"

echo ""
echo "============================================================"
echo "📚 BIBLIOTECA B2 APLICADA! Reconstruir:"
echo "   nohup docker build -t postarocket-app:v1 -f Dockerfile.dev . > /tmp/build.log 2>&1 &"
echo "   (aguarde o DONE, depois down/up)"
echo "============================================================"
