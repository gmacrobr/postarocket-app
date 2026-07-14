#!/bin/bash
# ============================================================
# APLICAR-POSTAROCKET.SH — Cirurgia de white-label v1
# Rodar na RAIZ do repositório postarocket-app clonado.
#   1) Substitui logos/favicon pela marca PostaRocket
#   2) Troca o roxo Postiz pelo laranja de fogo (#FF6B00)
#   3) Troca "Postiz" -> "PostaRocket" nos textos visíveis
#   4) Implementa exclusão REAL de mídia no R2 (removeFile
#      + deleteMedia apagando arquivo e thumbnail)
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }

[ -f Dockerfile.dev ] && [ -d apps/frontend ] || falha "Rode este script na RAIZ do repositório postarocket-app!"
[ -d rebrand-assets ] || falha "Pasta rebrand-assets/ não encontrada ao lado do script!"

echo "=== 1/4 — Logos e favicon ==="
PUB=apps/frontend/public
cp rebrand-assets/icone-quadrado.svg  $PUB/logo.svg
cp rebrand-assets/icone-quadrado.svg  $PUB/postiz.svg
cp rebrand-assets/wordmark.svg        $PUB/logo-text.svg
cp rebrand-assets/wordmark.svg        $PUB/postiz-text.svg
cp rebrand-assets/favicon-512.png     $PUB/favicon.png
cp rebrand-assets/favicon-512.png     $PUB/postiz-fav.png
cp rebrand-assets/favicon.ico         $PUB/favicon.ico
ok "7 arquivos de marca substituídos em apps/frontend/public/"

echo "=== 2/4 — Cores (roxo -> fogo) ==="
CSS=apps/frontend/src/app/colors.scss
grep -q "612bd3\|612ad5" $CSS || falha "cores #612bd3/#612ad5 não encontradas em $CSS (código mudou?)"
sed -i 's/#612bd3/#FF6B00/gI; s/#612ad5/#FF6B00/gI' $CSS
ok "cor primária agora é #FF6B00 (Laranja Propulsão)"

echo "=== 3/4 — Textos Postiz -> PostaRocket ==="
ANTES=$(grep -r "Postiz" apps/frontend/src libraries/react-shared-libraries --include="*.tsx" --include="*.ts" -o 2>/dev/null | wc -l)
grep -rl "Postiz" apps/frontend/src libraries/react-shared-libraries --include="*.tsx" --include="*.ts" 2>/dev/null \
  | xargs -r sed -i 's/Postiz/PostaRocket/g'
DEPOIS=$(grep -r "Postiz" apps/frontend/src libraries/react-shared-libraries --include="*.tsx" --include="*.ts" -o 2>/dev/null | wc -l)
ok "textos trocados: $ANTES ocorrências antes, $DEPOIS depois"

echo "=== 4/4 — Exclusão real de mídia no R2 ==="
python3 - <<'PYEOF'
import re, sys

# ---- a) cloudflare.storage.ts: implementar removeFile ----
p = 'libraries/nestjs-libraries/src/upload/cloudflare.storage.ts'
c = open(p).read()
if 'DeleteObjectCommand' not in c:
    c2 = re.sub(r"(import \{[^}]*?PutObjectCommand)", r"\1,\n  DeleteObjectCommand", c, count=1)
    assert c2 != c, 'import PutObjectCommand nao encontrado'
    c = c2
novo_remove = """async removeFile(filePath: string): Promise<void> {
    // PostaRocket: exclusao real no R2 (chave = caminho relativo a URL publica)
    try {
      const key = filePath
        .replace(this._uploadUrl + '/', '')
        .replace(/^https?:\\/\\/[^/]+\\//, '');
      if (!key) return;
      await this._client.send(
        new DeleteObjectCommand({ Bucket: this._bucketName, Key: key })
      );
    } catch (err) {
      console.error('PostaRocket: erro ao remover arquivo do R2:', err);
    }
  }"""
c2, n = re.subn(r"async removeFile\(filePath: string\): Promise<void> \{[\s\S]*?\n  \}", novo_remove, c, count=1)
assert n == 1, 'metodo removeFile nao encontrado em cloudflare.storage.ts'
open(p, 'w').write(c2)
print('  ✓ cloudflare.storage.ts: removeFile implementado (antes era um stub comentado)')

# ---- b) media.service.ts: deleteMedia apaga arquivo + thumbnail ----
p = 'libraries/nestjs-libraries/src/database/prisma/media/media.service.ts'
c = open(p).read()
antigo = """async deleteMedia(org: string, id: string) {
    return this._mediaRepository.deleteMedia(org, id);
  }"""
novo = """async deleteMedia(org: string, id: string) {
    // PostaRocket: apagar tambem o arquivo fisico (LGPD)
    try {
      const media = await this._mediaRepository.getMediaById(id);
      if (media && media.organizationId === org) {
        await this.storage.removeFile(media.path);
        if (media.thumbnail) {
          await this.storage.removeFile(media.thumbnail);
        }
      }
    } catch (err) {
      console.error('PostaRocket: erro ao remover arquivo do storage:', err);
    }
    return this._mediaRepository.deleteMedia(org, id);
  }"""
assert antigo in c, 'deleteMedia original nao encontrado em media.service.ts'
open(p, 'w').write(c.replace(antigo, novo, 1))
print('  ✓ media.service.ts: deleteMedia agora apaga arquivo e thumbnail do storage')
PYEOF

echo ""
echo "============================================================"
echo "🚀 CIRURGIA CONCLUÍDA! Próximos passos:"
echo "   docker build --target dist -t postarocket-app:v1 -f Dockerfile.dev ."
echo "   (demora 10-25 min na primeira vez — pode acompanhar tranquilo)"
echo "============================================================"
