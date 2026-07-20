import { Body, Controller, Get, Headers, HttpException, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreditsService } from '@gitroom/nestjs-libraries/database/prisma/credits/credits.service';

// PostaRocket: ponte de serviço (Control Rocket → PostaRocket).
// Autenticada por chave secreta, sem sessão de usuário.
// Usada pelo Control para creditar após pagamento confirmado no Asaas.
@ApiTags('CreditsService')
@Controller('/credits-service')
export class CreditsServiceController {
  constructor(private _credits: CreditsService) {}

  private auth(key: string) {
    const secret = process.env.PROVISIONER_SECRET;
    if (!secret || !key || key !== secret) {
      throw new HttpException('Unauthorized', 401);
    }
  }

  // Creditar após pagamento confirmado (idempotente via reference)
  @Post('/grant')
  async grant(
    @Headers('x-provisioner-key') key: string,
    @Body()
    body: {
      orgId: string;
      credits: number;
      reference?: string;
      description?: string;
    }
  ) {
    this.auth(key);
    if (!body?.orgId || !body?.credits) {
      throw new HttpException('orgId e credits são obrigatórios', 400);
    }

    // Idempotência: se já existe transação com este reference, não credita de novo
    if (body.reference) {
      const already = await this._credits.findByReference(body.reference);
      if (already) {
        const balance = await this._credits.getBalance(body.orgId);
        return { ok: true, duplicated: true, balance };
      }
    }

    const wallet = await this._credits.credit(body.orgId, body.credits, 'recarga', {
      description: body.description || 'Recarga confirmada',
      reference: body.reference,
    });

    return { ok: true, balance: wallet.balance, credited: body.credits };
  }

  // Consultar saldo (para o Control exibir na ficha do cliente)
  @Get('/balance')
  async balance(
    @Headers('x-provisioner-key') key: string,
    @Query('orgId') orgId: string
  ) {
    this.auth(key);
    if (!orgId) throw new HttpException('orgId é obrigatório', 400);
    const balance = await this._credits.getBalance(orgId);
    return { ok: true, orgId, balance, reais: (balance / 100).toFixed(2) };
  }
}
