#!/bin/bash
# ============================================================
# CORRIGIR-C3-STORAGE.SH — fix do boot travado
# Torna o UploadFactory.createStorage() preguiçoso (lazy):
# antes rodava na construção da classe (durante o boot do Nest),
# agora só é criado quando a imagem é realmente gerada.
# Rodar na RAIZ do repositório.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório!"
SVC=libraries/nestjs-libraries/src/database/prisma/studio/image.studio.service.ts
[ -f "$SVC" ] || falha "C3 não aplicado (image.studio.service.ts não encontrado)"

python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/studio/image.studio.service.ts'
c=open(p).read()

antigo = "  private storage = UploadFactory.createStorage();\n"
novo = """  private _storage: any = null;
  private get storage() {
    if (!this._storage) {
      this._storage = UploadFactory.createStorage();
    }
    return this._storage;
  }
"""

if 'private get storage()' in c:
    print('  ✓ já corrigido (lazy)')
else:
    assert antigo in c, 'linha do storage não encontrada'
    c = c.replace(antigo, novo, 1)
    open(p, 'w').write(c)
    print('  ✓ storage agora é preguiçoso (não roda no boot)')
PYEOF

echo ""
echo "============================================================"
echo "🔧 CORREÇÃO APLICADA! Reconstruir:"
echo "   nohup docker build -t postarocket-app:v1 -f Dockerfile.dev . > /tmp/build.log 2>&1 &"
echo "   (aguardar DONE, depois down/up)"
echo "============================================================"
