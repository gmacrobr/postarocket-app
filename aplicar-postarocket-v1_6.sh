#!/bin/bash
# ============================================================
# APLICAR-POSTAROCKET-V1.6.SH — Multi-IA 🧠 (OpenRouter)
# Novas variáveis (todas OPCIONAIS — sem elas, nada muda):
#   AI_BASE_URL  ex: https://openrouter.ai/api/v1
#   AI_API_KEY   ex: sk-or-v1-...
#   AI_MODEL     ex: anthropic/claude-sonnet-4.5
# Chat, Astro e Copiloto usam o modelo configurado.
# Geração de IMAGENS continua na OpenAI (OPENAI_API_KEY).
# Rodar na RAIZ do repositório, depois dos patches anteriores.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório postarocket-app!"

python3 - <<'PYEOF'
import re

# ---------- A) openai.service.ts: cliente de chat separado ----------
p = 'libraries/nestjs-libraries/src/openai/openai.service.ts'
c = open(p, encoding='utf-8').read()

if 'aiChat' not in c:
    bloco = """
// PostaRocket: cliente de CHAT configuravel (OpenRouter etc). Imagens seguem na OpenAI.
const aiChat = new OpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || 'sk-proj-',
  ...(process.env.AI_BASE_URL ? { baseURL: process.env.AI_BASE_URL } : {}),
});
const AI_MODEL = process.env.AI_MODEL || 'gpt-4.1';
"""
    m = re.search(r"const openai = new OpenAI\(\{[\s\S]*?\}\);\n", c)
    assert m, 'bloco do cliente openai nao encontrado'
    c = c[: m.end()] + bloco + c[m.end():]

n_chat = c.count('openai.chat')
c = c.replace('openai.chat', 'aiChat.chat')
n_model = c.count("model: 'gpt-4.1'")
c = c.replace("model: 'gpt-4.1'", 'model: AI_MODEL')
open(p, 'w', encoding='utf-8').write(c)
print(f'  ✓ openai.service.ts: {n_chat} chamadas de chat redirecionadas, {n_model} modelos parametrizados (imagens intactas)')

# ---------- B) agent.graph.service.ts: Astro configuravel ----------
p = 'libraries/nestjs-libraries/src/agent/agent.graph.service.ts'
c = open(p, encoding='utf-8').read()
antigo = """const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-',
  model: 'gpt-4.1',
  temperature: 0.7,
});"""
novo = """const model = new ChatOpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || 'sk-proj-',
  model: process.env.AI_MODEL || 'gpt-4.1',
  temperature: 0.7,
  ...(process.env.AI_BASE_URL
    ? { configuration: { baseURL: process.env.AI_BASE_URL } }
    : {}),
});"""
assert antigo in c, 'bloco ChatOpenAI nao encontrado'
c = c.replace(antigo, novo, 1)
open(p, 'w', encoding='utf-8').write(c)
print('  ✓ agent.graph.service.ts: Astro agora usa AI_BASE_URL/AI_MODEL (imagem DALL-E intacta)')

# ---------- C) copilot.controller.ts: copiloto configuravel ----------
p = 'apps/backend/src/api/routes/copilot.controller.ts'
c = open(p, encoding='utf-8').read()

if "import OpenAI from 'openai';" not in c:
    primeira_import = c.index('import ')
    c = c[:primeira_import] + "import OpenAI from 'openai';\n" + c[primeira_import:]

antigo_adapter = """serviceAdapter: new OpenAIAdapter({
        model: 'gpt-4.1',
      }),"""
novo_adapter = """serviceAdapter: new OpenAIAdapter({
        openai: new OpenAI({
          apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
          ...(process.env.AI_BASE_URL
            ? { baseURL: process.env.AI_BASE_URL }
            : {}),
        }) as any,
        model: process.env.AI_MODEL || 'gpt-4.1',
      }),"""
n = c.count(antigo_adapter)
assert n >= 1, 'adapters do copilot nao encontrados'
c = c.replace(antigo_adapter, novo_adapter)

antigo_guard = """process.env.OPENAI_API_KEY === undefined ||
      process.env.OPENAI_API_KEY === ''"""
novo_guard = """!(process.env.OPENAI_API_KEY || process.env.AI_API_KEY)"""
g = c.count(antigo_guard)
c = c.replace(antigo_guard, novo_guard)
open(p, 'w', encoding='utf-8').write(c)
print(f'  ✓ copilot.controller.ts: {n} adapter(s) e {g} guarda(s) atualizados')
PYEOF

echo ""
echo "============================================================"
echo "🧠 V1.6 APLICADO! Próximos passos:"
echo "  1) Criar conta/chave no OpenRouter (openrouter.ai)"
echo "  2) Adicionar AI_BASE_URL, AI_API_KEY e AI_MODEL no compose"
echo "  3) docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "  4) down + up e conversar com o Astro movido a Claude 😄"
echo "============================================================"
