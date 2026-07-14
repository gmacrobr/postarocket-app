#!/bin/bash
# ============================================================
# APLICAR-POSTAROCKET-V1.3.SH — Astro 👨‍🚀 + traduções finais
#   1) Postiz -> PostaRocket em TODOS os JSONs de idioma
#   2) Saudação do agente vira o Astro (pt + en)
#   3) Telas com inglês cravado traduzidas:
#      Assinaturas, Apps Aprovados, Integrações,
#      Configurações Globais e descrições HeyGen/Reel.Farm
# Rodar na RAIZ do repositório, depois dos patches anteriores
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório postarocket-app!"

echo "=== 1/3 — Marca nos arquivos de idioma ==="
ANTES=$(grep -l "Postiz" libraries/react-shared-libraries/src/translation/locales/*/translation.json | wc -l)
sed -i 's/Postiz/PostaRocket/g' libraries/react-shared-libraries/src/translation/locales/*/translation.json
ok "Postiz -> PostaRocket em $ANTES idioma(s)"

echo "=== 2/3 — Nascimento do Astro 👨‍🚀 ==="
python3 - <<'PYEOF'
import json

PT = ("Olá! Eu sou o Astro 👨‍🚀, o copiloto do PostaRocket.\n\n"
      "Posso criar e agendar uma ou várias publicações para múltiplos canais, "
      "além de gerar imagens e vídeos para você.\n\n"
      "Selecione os canais no menu à esquerda e me diga o que quer lançar — eu cuido da órbita. 🚀\n\n"
      "Suas conversas anteriores ficam no menu à direita.\n\n"
      "Dica: também funciono como Servidor MCP — veja Configurações >> API Pública.")

EN = ("Hi! I'm Astro 👨‍🚀, the PostaRocket copilot.\n\n"
      "I can create and schedule one or many posts across multiple channels, "
      "and generate images and videos for you.\n\n"
      "Pick your channels on the left menu and tell me what to launch — I'll handle the orbit. 🚀\n\n"
      "Your previous conversations are on the right menu.\n\n"
      "Tip: I also work as an MCP Server — see Settings >> Public API.")

for lang, txt in (('pt', PT), ('en', EN)):
    p = f'libraries/react-shared-libraries/src/translation/locales/{lang}/translation.json'
    d = json.load(open(p, encoding='utf-8'))
    assert 'agent_welcome_message' in d, f'chave nao encontrada em {lang}'
    d['agent_welcome_message'] = txt
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'  ✓ Astro instalado no idioma {lang}')
PYEOF

echo "=== 3/3 — Telas com inglês cravado ==="
python3 - <<'PYEOF'
MAPA = {
  'apps/frontend/src/components/settings/signatures.component.tsx': [
    ("'Edit Signature'", "'Editar Assinatura'"),
    ("'Add Signature'", "'Adicionar Assinatura'"),
    ("'Signatures'", "'Assinaturas'"),
    ("'You can add signatures to your account to be used in your posts.'",
     "'Adicione assinaturas à sua conta para usar nas suas publicações.'"),
    ("'Content'", "'Conteúdo'"),
    ("'Auto Add?'", "'Adicionar automaticamente?'"),
    ("'Actions'", "'Ações'"),
    ("'Use Signature'", "'Usar Assinatura'"),
    ("'Add a signature'", "'Adicionar uma assinatura'"),
    ("'Signature updated successfully'", "'Assinatura atualizada com sucesso'"),
    ("'Signature deleted successfully'", "'Assinatura excluída com sucesso'"),
    ("'Delete'", "'Excluir'"),
  ],
  'apps/frontend/src/components/approved-apps/approved-apps.component.tsx': [
    ("'Approved Apps'", "'Apps Aprovados'"),
    ("'No approved apps yet.'", "'Nenhum app aprovado ainda.'"),
    ("'Authorized on'", "'Autorizado em'"),
    ("'Access revoked successfully'", "'Acesso revogado com sucesso'"),
    ("'Failed to revoke access'", "'Falha ao revogar o acesso'"),
    ("'Revoke'", "'Revogar'"),
  ],
  'apps/frontend/src/components/third-parties/third-party.component.tsx': [
    (">No Integrations Yet<", ">Ainda não há integrações<"),
    ("'Are you sure you want to delete this integration?'",
     "'Tem certeza de que deseja excluir esta integração?'"),
    ("'Integration deleted successfully'", "'Integração excluída com sucesso'"),
    ("'Delete Integration'", "'Excluir Integração'"),
    (">Add<", ">Adicionar<"),
  ],
  'apps/frontend/src/components/settings/global.settings.tsx': [
    ("'Global Settings'", "'Configurações Globais'"),
  ],
  'libraries/nestjs-libraries/src/3rdparties/heygen/heygen.provider.ts': [
    ("'HeyGen is a platform for creating AI-generated avatars videos.'",
     "'Plataforma para criar vídeos com avatares gerados por IA.'"),
  ],
  'libraries/nestjs-libraries/src/3rdparties/reelfarm/reelfarm.provider.ts': [
    ("'Import UGC and greenscreen videos from your Reel.Farm account.'",
     "'Importe vídeos UGC e de fundo verde da sua conta Reel.Farm.'"),
  ],
}

total = 0
for arquivo, pares in MAPA.items():
    c = open(arquivo, encoding='utf-8').read()
    feitos = 0
    for antigo, novo in pares:
        if antigo in c:
            c = c.replace(antigo, novo)
            feitos += 1
    open(arquivo, 'w', encoding='utf-8').write(c)
    total += feitos
    print(f'  ✓ {arquivo.split("/")[-1]}: {feitos}/{len(pares)} traduções')
print(f'  ✓ total: {total} textos traduzidos')
PYEOF

echo ""
echo "============================================================"
echo "🚀 V1.3 APLICADO! Reconstruir a imagem:"
echo "   docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "============================================================"
