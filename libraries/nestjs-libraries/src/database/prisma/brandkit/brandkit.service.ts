import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

// PostaRocket: Kit de Marca (B3) — um por organização.
@Injectable()
export class BrandKitService {
  constructor(private _kit: PrismaRepository<'brandKit'>) {}

  // Busca o kit; cria vazio na primeira vez
  async get(orgId: string) {
    const found = await this._kit.model.brandKit.findUnique({
      where: { organizationId: orgId },
    });
    if (found) return found;
    return this._kit.model.brandKit.create({
      data: { organizationId: orgId },
    });
  }

  async save(orgId: string, data: any) {
    const allowed = [
      'logoLight', 'logoDark', 'logoWide', 'watermark',
      'colorPrimary', 'colorSecondary', 'colorAccent',
      'tradeName', 'legalName', 'document', 'email', 'whatsapp',
      'phone', 'website', 'address',
      'instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'x',
    ];
    const clean: any = {};
    for (const k of allowed) {
      if (k in (data || {})) clean[k] = data[k] === '' ? null : data[k];
    }
    await this.get(orgId); // garante que existe
    return this._kit.model.brandKit.update({
      where: { organizationId: orgId },
      data: clean,
    });
  }

  // Quão completo está o kit (para mostrar progresso ao cliente)
  async completeness(orgId: string) {
    const k: any = await this.get(orgId);
    const fields = [
      'logoLight', 'logoDark', 'colorPrimary', 'tradeName',
      'whatsapp', 'website', 'instagram',
    ];
    const filled = fields.filter((f) => !!k[f]).length;
    return { filled, total: fields.length, percent: Math.round((filled / fields.length) * 100) };
  }
}
