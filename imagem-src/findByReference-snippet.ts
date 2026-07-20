
  // ---------- Idempotência de recarga (Control Rocket / Asaas) ----------
  async findByReference(reference: string) {
    if (!reference) return null;
    return this._tx.model.creditTransaction.findFirst({
      where: { reference },
    });
  }
