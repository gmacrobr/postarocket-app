import { Injectable, HttpException } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

// PostaRocket: Solicitação de artes (B4)
@Injectable()
export class LibraryRequestService {
  constructor(private _req: PrismaRepository<'libraryRequest'>) {}

  // Pedidos do próprio tenant
  listMine(orgId: string) {
    return this._req.model.libraryRequest.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // Todos os pedidos (superadmin)
  listAll(status?: string) {
    return this._req.model.libraryRequest.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async counts() {
    const status = ['aberta', 'producao', 'atendida', 'recusada'];
    const out: Record<string, number> = {};
    for (const s of status) {
      out[s] = await this._req.model.libraryRequest.count({ where: { status: s } });
    }
    return out;
  }

  create(orgId: string, data: any) {
    if (!data?.title?.trim()) throw new HttpException('Informe o título', 400);
    if (!data?.description?.trim()) throw new HttpException('Descreva o que você precisa', 400);
    return this._req.model.libraryRequest.create({
      data: {
        organizationId: orgId,
        title: data.title.trim(),
        description: data.description.trim(),
        format: data.format || null,
        reference: data.reference || null,
        deadline: data.deadline || null,
      },
    });
  }

  // Cliente pode cancelar o próprio pedido enquanto está aberto
  async cancelMine(orgId: string, id: string) {
    const r = await this._req.model.libraryRequest.findUnique({ where: { id } });
    if (!r || r.organizationId !== orgId) throw new HttpException('Pedido não encontrado', 404);
    if (r.status !== 'aberta') throw new HttpException('Só é possível cancelar pedidos abertos', 400);
    return this._req.model.libraryRequest.delete({ where: { id } });
  }

  // Admin atualiza status / responde / entrega
  update(id: string, data: any) {
    const clean: any = {};
    for (const k of ['status', 'adminNote', 'deliveredUrl']) {
      if (k in (data || {})) clean[k] = data[k] || null;
    }
    return this._req.model.libraryRequest.update({ where: { id }, data: clean });
  }

  remove(id: string) {
    return this._req.model.libraryRequest.delete({ where: { id } });
  }
}
