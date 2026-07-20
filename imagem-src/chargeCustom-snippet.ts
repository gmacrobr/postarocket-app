
  // ---------- Débito de valor customizado (ex: custo do modelo de imagem) ----------
  async chargeCustom(orgId: string, cost: number, action: string, description?: string) {
    if (cost <= 0) throw new HttpException('Custo inválido', 400);
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
    return { ok: true, charged: cost, balance: wallet.balance };
  }
