#!/bin/bash
# ============================================================
# CORRIGIR-B4-COUNTS.SH — fix do erro TS2615
# O groupBy do Prisma gera erro de tipo circular na compilação.
# Trocamos por 4 contagens simples (mesmo resultado, sem erro).
# Rodar na RAIZ do repositório.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório!"
SVC=libraries/nestjs-libraries/src/database/prisma/library/library.request.service.ts
[ -f "$SVC" ] || falha "B4 não aplicado"

python3 - <<'PYEOF'
p='libraries/nestjs-libraries/src/database/prisma/library/library.request.service.ts'
c=open(p).read()

antigo = """  async counts() {
    const all = await this._req.model.libraryRequest.groupBy({
      by: ['status'],
      _count: { status: true },
    } as any);
    const out: Record<string, number> = { aberta: 0, producao: 0, atendida: 0, recusada: 0 };
    for (const r of all as any[]) out[r.status] = r._count.status;
    return out;
  }"""

novo = """  async counts() {
    const status = ['aberta', 'producao', 'atendida', 'recusada'];
    const out: Record<string, number> = {};
    for (const s of status) {
      out[s] = await this._req.model.libraryRequest.count({ where: { status: s } });
    }
    return out;
  }"""

if 'groupBy' not in c:
    print('  ✓ já corrigido')
else:
    assert antigo in c, 'bloco counts() nao encontrado'
    c = c.replace(antigo, novo, 1)
    open(p, 'w').write(c)
    print('  ✓ counts() agora usa contagens simples (sem groupBy)')
PYEOF

echo ""
echo "============================================================"
echo "🔧 CORREÇÃO APLICADA! Reconstruir:"
echo "   nohup docker build -t postarocket-app:v1 -f Dockerfile.dev . > /tmp/build.log 2>&1 &"
echo "============================================================"
