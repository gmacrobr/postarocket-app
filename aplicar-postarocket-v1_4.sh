#!/bin/bash
# ============================================================
# APLICAR-POSTAROCKET-V1.4.SH — O PROVISIONADOR 🔧
# Cria a rota interna POST /api/provisioner/create que:
#   - exige a chave secreta no header x-provisioner-key
#   - cria organização + usuário (mesmo com registro travado)
#   - gera senha forte e devolve as credenciais
# É o motor que o Control Rocket e o webhook Asaas vão usar.
# Rodar na RAIZ do repositório, depois dos patches anteriores.
# ============================================================
set -e
ok(){ echo "  ✓ $1"; }
falha(){ echo "  ✗ ERRO: $1"; exit 1; }
[ -f Dockerfile.dev ] || falha "Rode na RAIZ do repositório postarocket-app!"

echo "=== 1/2 — Criar o ProvisionerController ==="
cat > apps/backend/src/api/routes/provisioner.controller.ts <<'EOF'
import { Body, Controller, Headers, HttpException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationService } from '@gitroom/nestjs-libraries/database/prisma/organizations/organization.service';
import { CreateOrgUserDto } from '@gitroom/nestjs-libraries/dtos/auth/create.org.user.dto';
import { Provider } from '@prisma/client';
import { randomBytes } from 'crypto';

// PostaRocket: provisionador interno de contas (Control Rocket / Asaas)
@ApiTags('Provisioner')
@Controller('/provisioner')
export class ProvisionerController {
  constructor(private _organizationService: OrganizationService) {}

  @Post('/create')
  async create(
    @Headers('x-provisioner-key') key: string,
    @Body() body: { email: string; company: string }
  ) {
    const secret = process.env.PROVISIONER_SECRET;
    if (!secret || !key || key !== secret) {
      throw new HttpException('Unauthorized', 401);
    }
    if (!body?.email || !body?.company) {
      throw new HttpException('email e company sao obrigatorios', 400);
    }

    const email = String(body.email).toLowerCase().trim();
    const password = randomBytes(9).toString('base64url');

    const dto = new CreateOrgUserDto();
    dto.email = email;
    dto.password = password;
    dto.company = String(body.company).trim();
    dto.provider = Provider.LOCAL;

    try {
      const create = await this._organizationService.createOrgAndUser(
        dto,
        '127.0.0.1',
        'postarocket-provisioner'
      );
      return {
        ok: true,
        orgId: create.id,
        userId: create.users[0].user.id,
        login: email,
        senha: password,
        painel: process.env.FRONTEND_URL,
      };
    } catch (err: any) {
      const msg = String(err?.message || 'Erro ao provisionar');
      const friendly = msg.includes('Unique') || msg.includes('exists')
        ? 'E-mail ja cadastrado'
        : msg;
      throw new HttpException(friendly, 400);
    }
  }
}
EOF
ok "apps/backend/src/api/routes/provisioner.controller.ts criado"

echo "=== 2/2 — Registrar o controller no módulo (rota pública, fora do AuthMiddleware) ==="
python3 - <<'PYEOF'
p = 'apps/backend/src/api/api.module.ts'
c = open(p).read()

imp = "import { ProvisionerController } from '@gitroom/backend/api/routes/provisioner.controller';\n"
anchor_imp = "import { AuthController } from '@gitroom/backend/api/routes/auth.controller';\n"
assert anchor_imp in c, 'import do AuthController nao encontrado'
if 'ProvisionerController' not in c:
    c = c.replace(anchor_imp, anchor_imp + imp, 1)
    # adiciona SOMENTE na lista controllers (linha 'AuthController,' dentro do bloco controllers)
    # ancora: primeira ocorrencia de '    AuthController,\n' APOS 'controllers: ['
    idx = c.index('controllers: [')
    marker = '    AuthController,\n'
    pos = c.index(marker, idx)
    c = c[:pos] + marker + '    ProvisionerController,\n' + c[pos + len(marker):]
open(p, 'w').write(c)

# validacao: fora da lista authenticatedController
head = c[: c.index('controllers: [')]
assert 'ProvisionerController' not in head.split('const authenticatedController')[-1].split('];')[0] if 'const authenticatedController' in head else True
print('  ✓ ProvisionerController registrado como rota publica (protegida pela chave secreta)')
PYEOF

echo ""
echo "============================================================"
echo "🚀 V1.4 APLICADO! Próximos passos:"
echo "  1) Adicionar PROVISIONER_SECRET no compose (comando fornecido)"
echo "  2) docker build -t postarocket-app:v1 -f Dockerfile.dev ."
echo "  3) down + up e testar com o curl fornecido"
echo "============================================================"
