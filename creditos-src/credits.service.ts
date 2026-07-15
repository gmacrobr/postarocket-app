import { Injectable, HttpException } from '@nestjs/common';
import { PrismaRepository, PrismaTransaction } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

// PostaRocket: serviço da Carteira de Créditos (pré-pago)
// Débito ATÔMICO: checa saldo, debita e registra numa transação única.
@Injectable()
export class CreditsService {
  constructor(
    private _wallet: PrismaRepository<'creditWallet'>,
    private _tx: PrismaRepository<'creditTransaction'>,
    private _pkg: PrismaRepository<'creditPackage'>,
    private _price: PrismaRepository<'creditActionPrice'>,
    private _transaction: PrismaTransaction
  ) {}

  // Garante que a carteira existe (cria com saldo 0 na primeira vez)
  async getWallet(orgId: string) {
    const existing = await this._wallet.model.creditWallet.findUnique({
      where: { organizationId: orgId },
    });
    if (existing) return existing;
    return this._wallet.model.creditWallet.create({
      data: { organizationId: orgId, balance: 0 },
    });
  }

  async getBalance(orgId: string) {
    const w = await this.getWallet(orgId);
    return w.balance;
  }

  async history(orgId: string, take = 50) {
    const w = await this.getWallet(orgId);
    return this._tx.model.creditTransaction.findMany({
      where: { walletId: w.id },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  // ---------- Crédito (recarga / bônus / ajuste) ----------
  async credit(
    orgId: string,
    amount: number,
    type: 'recarga' | 'bonus' | 'ajuste' | 'estorno',
    opts: { description?: string; reference?: string; action?: string } = {}
  ) {
    if (amount <= 0) throw new HttpException('Valor inválido', 400);
    const w = await this.getWallet(orgId);
    const [wallet] = await this._transaction.model.$transaction([
      this._wallet.model.creditWallet.update({
        where: { id: w.id },
        data: { balance: { increment: amount } },
      }),
      this._tx.model.creditTransaction.create({
        data: {
          walletId: w.id,
          amount,
          balanceAfter: w.balance + amount,
          type,
          description: opts.description,
          reference: opts.reference,
          action: opts.action,
        },
      }),
    ]);
    return wallet;
  }

  // ---------- Custo de uma ação ----------
  async getActionCost(action: string): Promise<number> {
    const p = await this._price.model.creditActionPrice.findUnique({
      where: { action },
    });
    return p?.active ? p.cost : 0;
  }

  // ---------- Débito ATÔMICO (o coração do pré-pago) ----------
  // Debita ANTES da execução da IA. Retorna { ok, balance } ou lança 402.
  async charge(orgId: string, action: string, description?: string) {
    const cost = await this.getActionCost(action);
    const w = await this.getWallet(orgId);

    if (w.balance < cost) {
      throw new HttpException(
        { statusCode: 402, message: 'Créditos insuficientes', needed: cost, balance: w.balance },
        402
      );
    }

    const [wallet] = await this._transaction.model.$transaction([
      this._wallet.model.creditWallet.update({
        where: { id: w.id },
        data: { balance: { decrement: cost } },
      }),
      this._tx.model.creditTransaction.create({
        data: {
          walletId: w.id,
          amount: -cost,
          balanceAfter: w.balance - cost,
          type: 'consumo',
          action,
          description,
        },
      }),
    ]);
    return { ok: true, charged: cost, balance: wallet.balance, walletId: w.id };
  }

  // Estorno (se a geração da IA falhar depois do débito)
  async refund(orgId: string, amount: number, description?: string) {
    return this.credit(orgId, amount, 'estorno', {
      description: description || 'Estorno por falha na geração',
    });
  }

  // ---------- Pacotes ----------
  getPackages(onlyActive = true) {
    return this._pkg.model.creditPackage.findMany({
      ...(onlyActive ? { where: { active: true } } : {}),
      orderBy: { order: 'asc' },
    });
  }
  getPackage(id: string) {
    return this._pkg.model.creditPackage.findUnique({ where: { id } });
  }
  createPackage(data: any) {
    return this._pkg.model.creditPackage.create({ data });
  }
  updatePackage(id: string, data: any) {
    return this._pkg.model.creditPackage.update({ where: { id }, data });
  }
  deletePackage(id: string) {
    return this._pkg.model.creditPackage.delete({ where: { id } });
  }

  // ---------- Preços de ação ----------
  getActionPrices() {
    return this._price.model.creditActionPrice.findMany({ orderBy: { cost: 'asc' } });
  }
  upsertActionPrice(action: string, data: { label: string; cost: number; active?: boolean }) {
    return this._price.model.creditActionPrice.upsert({
      where: { action },
      create: { action, ...data },
      update: data,
    });
  }

  // Semear dados iniciais (pacotes + preços) — idempotente
  async seedDefaults() {
    const count = await this._pkg.model.creditPackage.count();
    if (count === 0) {
      await this._pkg.model.creditPackage.createMany({
        data: [
          { name: '🚀 Teste', price: 1000, credits: 1000, bonus: 0, order: 1 },
          { name: '⭐ Popular', price: 2000, credits: 2000, bonus: 200, order: 2 },
          { name: '🔥 Pro', price: 5000, credits: 5000, bonus: 750, order: 3 },
          { name: '💎 Studio', price: 10000, credits: 10000, bonus: 2000, order: 4 },
        ],
      });
    }
    const pc = await this._price.model.creditActionPrice.count();
    if (pc === 0) {
      await this._price.model.creditActionPrice.createMany({
        data: [
          { action: 'copy', label: 'Gerar copy / texto', cost: 5 },
          { action: 'imagem', label: 'Gerar imagem', cost: 50 },
          { action: 'flyer', label: 'Gerar flyer / panfleto', cost: 30 },
          { action: 'video', label: 'Gerar vídeo', cost: 300 },
        ],
      });
    }
    return { ok: true };
  }
}
