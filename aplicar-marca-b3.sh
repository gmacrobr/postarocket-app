#!/bin/bash
# ============================================================
# APLICAR-MARCA-B3.SH — Kit de Marca (Minha Marca)
#   - model BrandKit (1 por organização)
#   - service + controller
#   - tela "Minha Marca": 4 logos, 3 cores, 8 dados, 6 redes
#   - item no menu
# Rodar na RAIZ do repositório. Fonte em ./b3-src.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório!"
[ -d b3-src ] || falha "pasta b3-src/ não encontrada!"
SCHEMA=libraries/nestjs-libraries/src/database/prisma/schema.prisma

echo "=== 1/6 — Model no schema ==="
if grep -q "model BrandKit" $SCHEMA; then ok "model já existe";
else cat b3-src/schema-append.prisma >> $SCHEMA; ok "model BrandKit adicionado"; fi

echo "=== 2/6 — Relação no Organization ==="
python3 - <<'PYEOF'
import re
p='libraries/nestjs-libraries/src/database/prisma/schema.prisma'
c=open(p).read()
if 'brandKit' in c:
    print('  ✓ relação já existe')
else:
    m=re.search(r'(model Organization \{.*?)(\n\})', c, re.S)
    assert m, 'model Organization nao encontrado'
    c=c[:m.end(1)]+'\n  brandKit              BrandKit?'+c[m.end(1):]
    open(p,'w').write(c)
    print('  ✓ relação brandKit adicionada')
PYEOF

echo "=== 3/6 — Backend (service + controller) ==="
mkdir -p libraries/nestjs-libraries/src/database/prisma/brandkit
cp b3-src/brandkit.service.ts libraries/nestjs-libraries/src/database/prisma/brandkit/
cp b3-src/brandkit.controller.ts apps/backend/src/api/routes/
ok "arquivos copiados"

echo "=== 4/6 — Registrar service ==="
python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/database.module.ts'
c=open(p).read()
imp="import { BrandKitService } from '@gitroom/nestjs-libraries/database/prisma/brandkit/brandkit.service';\n"
anchor="import { MediaService } from '@gitroom/nestjs-libraries/database/prisma/media/media.service';\n"
assert anchor in c
if 'BrandKitService' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    c=c.replace("    MediaService,\n", "    MediaService,\n    BrandKitService,\n", 1)
open(p,'w').write(c); print('  ✓ BrandKitService registrado')
PYEOF

echo "=== 5/6 — Registrar controller ==="
python3 - <<'PYEOF'
p='apps/backend/src/api/api.module.ts'
c=open(p).read()
imp="import { BrandKitController } from '@gitroom/backend/api/routes/brandkit.controller';\n"
anchor="import { AuthController } from '@gitroom/backend/api/routes/auth.controller';\n"
assert anchor in c
if 'BrandKitController' not in c:
    c=c.replace(anchor, anchor+imp, 1)
    idx=c.index('controllers: ['); marker='    AuthController,\n'
    pos=c.index(marker, idx)
    c=c[:pos]+marker+'    BrandKitController,\n'+c[pos+len(marker):]
    if 'const authenticatedController' in c:
        ac=c.index('const authenticatedController'); br=c.index('[', ac)
        c=c[:br+1]+'\n    BrandKitController,'+c[br+1:]
open(p,'w').write(c); print('  ✓ BrandKitController registrado (autenticado)')
PYEOF

echo "=== 6/6 — Frontend (página + menu) ==="
mkdir -p apps/frontend/src/components/brandkit
cp b3-src/brandkit.component.tsx apps/frontend/src/components/brandkit/
mkdir -p "apps/frontend/src/app/(app)/(site)/minha-marca"
cat > "apps/frontend/src/app/(app)/(site)/minha-marca/page.tsx" <<'EOF'
export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { BrandKitComponent } from '@gitroom/frontend/components/brandkit/brandkit.component';
export const metadata: Metadata = { title: 'PostaRocket Minha Marca', description: '' };
export default async function Index() { return <BrandKitComponent />; }
EOF
python3 - <<'PYEOF'
p='apps/frontend/src/components/layout/top.menu.tsx'
c=open(p).read()
ITEM="""    {
      name: t('minha_marca', 'Minha Marca'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="21" viewBox="0 0 24 24" fill="none">
          <path d="M12 3l7 4v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8V7l7-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      ),
      path: '/minha-marca',
    },
"""
anchor="      path: '/biblioteca',\n    },\n"
if "'/minha-marca'" not in c and anchor in c:
    c=c.replace(anchor, anchor+ITEM, 1); open(p,'w').write(c)
    print('  ✓ item Minha Marca adicionado ao menu')
else: print('  ✓ item já existe ou âncora ausente')
PYEOF

echo ""
echo "============================================================"
echo "🎨 KIT DE MARCA B3 APLICADO! Reconstruir:"
echo "   nohup docker build -t postarocket-app:v1 -f Dockerfile.dev . > /tmp/build.log 2>&1 &"
echo "   (aguarde o DONE, depois down/up)"
echo "============================================================"
