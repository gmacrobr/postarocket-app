#!/bin/bash
# ============================================================
# APLICAR-SAIDAS-B32.SH — As 3 saídas da Biblioteca
#   - modal de composição (logo + cores + contatos via canvas)
#   - botões nos cards: 🚀 Usar  ·  ✨ Minha marca
#   - salva o resultado na Mídia do tenant ou baixa
# Rodar na RAIZ do repositório, depois de B2 e B3.1.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório!"
[ -d b32-src ] || falha "pasta b32-src/ não encontrada!"
LIB=apps/frontend/src/components/library/library.b2.component.tsx
[ -f "$LIB" ] || falha "B2 precisa estar aplicado antes!"
[ -f libraries/nestjs-libraries/src/database/prisma/brandkit/brandkit.service.ts ] || falha "B3.1 (Kit de Marca) precisa estar aplicado antes!"

echo "=== 1/2 — Componente do modal ==="
cp b32-src/brand.compose.tsx apps/frontend/src/components/brandkit/
ok "brand.compose.tsx copiado"

echo "=== 2/2 — Integrar botões nos cards da Biblioteca ==="
python3 - <<'PYEOF'
p='apps/frontend/src/components/library/library.b2.component.tsx'
c=open(p).read()

if 'BrandComposeModal' in c:
    print('  ✓ já integrado')
else:
    # 1) import
    anchor_imp = "import { useUser } from '@gitroom/frontend/components/layout/user.context';\n"
    imp = "import { BrandComposeModal } from '@gitroom/frontend/components/brandkit/brand.compose';\n"
    assert anchor_imp in c, 'import de useUser nao encontrado'
    c = c.replace(anchor_imp, anchor_imp + imp, 1)

    # 2) estado do modal
    anchor_state = "  const [adminOpen, setAdminOpen] = useState(false);\n"
    state = "  const [compose, setCompose] = useState<Media | null>(null);\n"
    assert anchor_state in c, 'estado adminOpen nao encontrado'
    c = c.replace(anchor_state, anchor_state + state, 1)

    # 3) trocar o botão "Baixar" pelos dois botões de saída
    antigo = """                  <a href={m.url} download target="_blank" rel="noreferrer"
                    className="mt-[7px] block text-center text-[11px] font-[700] py-[6px] rounded-[8px] text-white"
                    style={{ background: 'linear-gradient(135deg,#FF6B00,#E11D2E)' }}>
                    Baixar
                  </a>"""
    novo = """                  <div className="flex gap-[5px] mt-[7px]">
                    <a href={m.url} download target="_blank" rel="noreferrer"
                      className="flex-1 text-center text-[11px] font-[700] py-[6px] rounded-[8px]"
                      style={{ border: '1px solid rgba(255,255,255,.15)', color: '#B8A9CF' }}
                      title="Usar a arte original">
                      🚀 Usar
                    </a>
                    <button onClick={() => setCompose(m)}
                      className="flex-1 text-[11px] font-[700] py-[6px] rounded-[8px] text-white"
                      style={{ background: 'linear-gradient(135deg,#FF6B00,#E11D2E)' }}
                      title="Gerar com a minha marca">
                      ✨ Marca
                    </button>
                  </div>"""
    assert antigo in c, 'bloco do botao Baixar nao encontrado'
    c = c.replace(antigo, novo, 1)

    # 4) render do modal no fim do componente principal
    antigo_fim = """        </div>
      )}
    </div>
  );
};

const Empty:"""
    novo_fim = """        </div>
      )}

      {compose && <BrandComposeModal media={compose} onClose={() => setCompose(null)} />}
    </div>
  );
};

const Empty:"""
    assert antigo_fim in c, 'fechamento do componente nao encontrado'
    c = c.replace(antigo_fim, novo_fim, 1)

    open(p, 'w').write(c)
    print('  ✓ botões 🚀 Usar e ✨ Marca integrados aos cards')
PYEOF

echo ""
echo "============================================================"
echo "✨ SAÍDAS B3.2 APLICADAS! Reconstruir:"
echo "   nohup docker build -t postarocket-app:v1 -f Dockerfile.dev . > /tmp/build.log 2>&1 &"
echo "   (aguarde o DONE, depois down/up)"
echo "============================================================"
