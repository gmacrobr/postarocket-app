#!/bin/bash
# ============================================================
# APLICAR-POSTAROCKET-V1.6.1.SH — Correção: chat do Astro
# O chat do Astro usa uma 3ª pilha (Vercel AI SDK) que ignora
# as variáveis do v1.6 e exige a API "responses" da OpenAI
# (incompatível com OpenRouter). Este patch:
#   - cria um provider configurável (AI_API_KEY/AI_BASE_URL)
#   - com AI_BASE_URL definido, usa chat-completions (OpenRouter ✓)
#   - sem as variáveis, mantém o comportamento original
# Rodar na RAIZ do repositório, depois do v1.6.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório postarocket-app!"

python3 - <<'PYEOF'
p = 'libraries/nestjs-libraries/src/chat/load.tools.service.ts'
c = open(p, encoding='utf-8').read()

# 1) import: adicionar createOpenAI
antigo_imp = "import { openai } from '@ai-sdk/openai';"
novo_imp = """import { openai, createOpenAI } from '@ai-sdk/openai';

// PostaRocket: provider de chat configuravel (OpenRouter etc.)
const aiProvider = createOpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',
  ...(process.env.AI_BASE_URL ? { baseURL: process.env.AI_BASE_URL } : {}),
});
const astroModel = () =>
  process.env.AI_BASE_URL
    ? aiProvider.chat(process.env.AI_MODEL || 'gpt-4.1')
    : openai('gpt-5.2');"""
assert antigo_imp in c, 'import do @ai-sdk/openai nao encontrado'
c = c.replace(antigo_imp, novo_imp, 1)

# 2) uso: trocar o modelo fixo pelo configuravel
antigo_uso = "model: openai('gpt-5.2'),"
assert antigo_uso in c, 'uso do modelo gpt-5.2 nao encontrado'
c = c.replace(antigo_uso, 'model: astroModel(),')

open(p, 'w', encoding='utf-8').write(c)
print('  ✓ load.tools.service.ts: chat do Astro agora respeita AI_BASE_URL/AI_API_KEY/AI_MODEL')
PYEOF

echo ""
echo "============================================================"
echo "🧠 V1.6.1 APLICADO! Agora:"
echo "  1) Colocar a chave REAL do OpenRouter no compose"
echo "  2) docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "  3) down + up e testar o Astro"
echo "============================================================"
