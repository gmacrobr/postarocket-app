#!/bin/bash
# ============================================================
# APLICAR-BIBLIOTECA-B1.SH — Biblioteca Rocket (fundação)
#   - models Prisma (LibraryNiche/Media/Ad)  [db push automático no boot]
#   - repository + service + controller (backend)
#   - registro no database.module e api.module
#   - página frontend real (troca o placeholder "Em breve")
# Rodar na RAIZ do repositório. Os arquivos-fonte vêm na pasta
# ./biblioteca-src (incluída no zip).
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório postarocket-app!"
[ -d biblioteca-src ] || falha "pasta biblioteca-src/ não encontrada ao lado do script!"

echo "=== 1/5 — Models no schema Prisma ==="
SCHEMA=libraries/nestjs-libraries/src/database/prisma/schema.prisma
if grep -q "model LibraryNiche" $SCHEMA; then
  ok "models já existem (pulando)"
else
  cat biblioteca-src/schema-append.prisma >> $SCHEMA
  ok "3 models adicionados ao schema"
fi

echo "=== 2/5 — Backend (repository, service, controller) ==="
mkdir -p libraries/nestjs-libraries/src/database/prisma/library
cp biblioteca-src/library.repository.ts libraries/nestjs-libraries/src/database/prisma/library/
cp biblioteca-src/library.service.ts    libraries/nestjs-libraries/src/database/prisma/library/
cp biblioteca-src/library.controller.ts apps/backend/src/api/routes/
ok "arquivos backend copiados"

echo "=== 3/5 — Registrar service no database.module ==="
python3 - <<'PYEOF'
p = 'libraries/nestjs-libraries/src/database/prisma/database.module.ts'
c = open(p).read()
imp = ("import { LibraryService } from '@gitroom/nestjs-libraries/database/prisma/library/library.service';\n"
       "import { LibraryRepository } from '@gitroom/nestjs-libraries/database/prisma/library/library.repository';\n")
anchor_imp = "import { MediaService } from '@gitroom/nestjs-libraries/database/prisma/media/media.service';\n"
assert anchor_imp in c, 'ancora de import (MediaService) nao encontrada'
if 'LibraryService' not in c:
    c = c.replace(anchor_imp, anchor_imp + imp, 1)
    # providers + exports: inserir apos "MediaService,\n"
    c = c.replace("    MediaService,\n", "    MediaService,\n    LibraryService,\n    LibraryRepository,\n", 1)
open(p, 'w').write(c)
print('  ✓ LibraryService/Repository registrados no database.module')
PYEOF

echo "=== 4/5 — Registrar controller no api.module ==="
python3 - <<'PYEOF'
p = 'apps/backend/src/api/api.module.ts'
c = open(p).read()
imp = "import { LibraryController } from '@gitroom/backend/api/routes/library.controller';\n"
anchor_imp = "import { AuthController } from '@gitroom/backend/api/routes/auth.controller';\n"
assert anchor_imp in c
if 'LibraryController' not in c:
    c = c.replace(anchor_imp, anchor_imp + imp, 1)
    idx = c.index('controllers: [')
    marker = '    AuthController,\n'
    pos = c.index(marker, idx)
    c = c[:pos] + marker + '    LibraryController,\n' + c[pos+len(marker):]
    # Biblioteca exige login -> adicionar ao authenticatedController
    if 'const authenticatedController' in c:
        ac = c.index('const authenticatedController')
        br = c.index('[', ac)
        c = c[:br+1] + '\n    LibraryController,' + c[br+1:]
open(p, 'w').write(c)
print('  ✓ LibraryController registrado (rota autenticada)')
PYEOF

echo "=== 5/5 — Página frontend (substitui o 'Em breve') ==="
mkdir -p apps/frontend/src/components/library
cp biblioteca-src/library.component.tsx apps/frontend/src/components/library/
cat > "apps/frontend/src/app/(app)/(site)/biblioteca/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { LibraryComponent } from '@gitroom/frontend/components/library/library.component';

export const metadata: Metadata = {
  title: 'PostaRocket Biblioteca',
  description: '',
};

export default async function Index() {
  return <LibraryComponent />;
}
EOF
ok "página /biblioteca agora usa o componente real"

echo ""
echo "============================================================"
echo "📚 BIBLIOTECA B1 APLICADA! Reconstruir a imagem:"
echo "   docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "   (o boot roda prisma db push e cria as tabelas sozinho)"
echo "============================================================"
