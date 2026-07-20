import { Injectable, HttpException } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

// PostaRocket: Biblioteca B2 — hierarquia (Nicho → Segmento → Categoria) e Packs
@Injectable()
export class LibraryTreeService {
  constructor(
    private _niche: PrismaRepository<'libraryNiche'>,
    private _segment: PrismaRepository<'librarySegment'>,
    private _category: PrismaRepository<'libraryCategory'>,
    private _pack: PrismaRepository<'libraryPack'>,
    private _media: PrismaRepository<'libraryMedia'>
  ) {}

  // ---------- Segmentos ----------
  getSegments(nicheId?: string) {
    return this._segment.model.librarySegment.findMany({
      where: { active: true, ...(nicheId ? { nicheId } : {}) },
      orderBy: { order: 'asc' },
      include: { categories: { where: { active: true }, orderBy: { order: 'asc' } } },
    });
  }
  createSegment(data: { name: string; nicheId: string; order?: number }) {
    if (!data?.name || !data?.nicheId) throw new HttpException('Nome e nicho obrigatórios', 400);
    return this._segment.model.librarySegment.create({ data });
  }
  updateSegment(id: string, data: any) {
    return this._segment.model.librarySegment.update({ where: { id }, data });
  }
  deleteSegment(id: string) {
    return this._segment.model.librarySegment.delete({ where: { id } });
  }

  // ---------- Categorias ----------
  getCategories(segmentId?: string) {
    return this._category.model.libraryCategory.findMany({
      where: { active: true, ...(segmentId ? { segmentId } : {}) },
      orderBy: { order: 'asc' },
    });
  }
  createCategory(data: { name: string; segmentId: string; order?: number }) {
    if (!data?.name || !data?.segmentId) throw new HttpException('Nome e segmento obrigatórios', 400);
    return this._category.model.libraryCategory.create({ data });
  }
  updateCategory(id: string, data: any) {
    return this._category.model.libraryCategory.update({ where: { id }, data });
  }
  deleteCategory(id: string) {
    return this._category.model.libraryCategory.delete({ where: { id } });
  }

  // ---------- Packs ----------
  getPacks(filter: { nicheId?: string; segmentId?: string } = {}) {
    return this._pack.model.libraryPack.findMany({
      where: {
        active: true,
        ...(filter.nicheId ? { nicheId: filter.nicheId } : {}),
        ...(filter.segmentId ? { segmentId: filter.segmentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Conta itens de cada pack (imagens e vídeos)
  async getPacksWithCount(filter: { nicheId?: string; segmentId?: string } = {}) {
    const packs = await this.getPacks(filter);
    const out = [];
    for (const p of packs) {
      const images = await this._media.model.libraryMedia.count({
        where: { packId: p.id, active: true, type: 'image' },
      });
      const videos = await this._media.model.libraryMedia.count({
        where: { packId: p.id, active: true, type: 'video' },
      });
      out.push({ ...p, images, videos, total: images + videos });
    }
    return out;
  }

  // Gera código automático: EDU-TEC-001
  private async nextCode(nicheName?: string, segmentName?: string) {
    const clean = (s?: string) =>
      (s || 'GEN')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase()
        .slice(0, 3)
        .padEnd(3, 'X');
    const prefix = `${clean(nicheName)}-${clean(segmentName)}`;
    const count = await this._pack.model.libraryPack.count({
      where: { code: { startsWith: prefix } },
    });
    return `${prefix}-${String(count + 1).padStart(3, '0')}`;
  }

  async createPack(data: {
    name: string;
    nicheId?: string;
    segmentId?: string;
    description?: string;
    code?: string;
  }) {
    if (!data?.name) throw new HttpException('Nome do pack é obrigatório', 400);
    let code = data.code;
    if (!code) {
      const niche = data.nicheId
        ? await this._niche.model.libraryNiche.findUnique({ where: { id: data.nicheId } })
        : null;
      const seg = data.segmentId
        ? await this._segment.model.librarySegment.findUnique({ where: { id: data.segmentId } })
        : null;
      code = await this.nextCode(niche?.name, seg?.name);
    }
    return this._pack.model.libraryPack.create({
      data: {
        code,
        name: data.name,
        nicheId: data.nicheId,
        segmentId: data.segmentId,
        description: data.description,
      },
    });
  }
  updatePack(id: string, data: any) {
    return this._pack.model.libraryPack.update({ where: { id }, data });
  }
  deletePack(id: string) {
    return this._pack.model.libraryPack.delete({ where: { id } });
  }

  // ---------- Mídias (com filtros da hierarquia) ----------
  listMedias(filter: {
    nicheId?: string;
    segmentId?: string;
    categoryId?: string;
    packId?: string;
    orientation?: string;
    approval?: string;
    type?: string;
    q?: string;
  }) {
    return this._media.model.libraryMedia.findMany({
      where: {
        active: true,
        ...(filter.nicheId ? { nicheId: filter.nicheId } : {}),
        ...(filter.segmentId ? { segmentId: filter.segmentId } : {}),
        ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
        ...(filter.packId ? { packId: filter.packId } : {}),
        ...(filter.orientation ? { orientation: filter.orientation } : {}),
        ...(filter.approval ? { approval: filter.approval } : {}),
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.q ? { title: { contains: filter.q, mode: 'insensitive' as any } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // Criação em massa (upload por arquivo ou link)
  async createMedias(items: any[]) {
    if (!Array.isArray(items) || !items.length) {
      throw new HttpException('Nenhum item enviado', 400);
    }
    const data = items.map((i) => ({
      title: i.title || i.fileName || 'sem-nome',
      fileName: i.fileName || i.title,
      type: /\.(mp4|webm|mov)$/i.test(i.url || '') ? 'video' : 'image',
      url: i.url,
      thumbnail: i.thumbnail || null,
      nicheId: i.nicheId || null,
      segmentId: i.segmentId || null,
      categoryId: i.categoryId || null,
      packId: i.packId || null,
      width: i.width || null,
      height: i.height || null,
      orientation:
        i.orientation ||
        (i.width && i.height
          ? i.width === i.height
            ? 'quadrado'
            : i.height > i.width
            ? 'vertical'
            : 'horizontal'
          : null),
      tags: i.tags || null,
      approval: 'novo',
    }));
    await this._media.model.libraryMedia.createMany({ data });
    return { ok: true, created: data.length };
  }

  updateMedia(id: string, data: any) {
    return this._media.model.libraryMedia.update({ where: { id }, data });
  }
  deleteMedia(id: string) {
    return this._media.model.libraryMedia.delete({ where: { id } });
  }

  // Ações em massa
  async bulk(action: string, ids: string[], payload: any = {}) {
    if (!ids?.length) throw new HttpException('Nenhum item selecionado', 400);
    if (action === 'delete') {
      await this._media.model.libraryMedia.deleteMany({ where: { id: { in: ids } } });
      return { ok: true, affected: ids.length };
    }
    if (action === 'approve') {
      await this._media.model.libraryMedia.updateMany({
        where: { id: { in: ids } },
        data: { approval: 'aprovado' },
      });
      return { ok: true, affected: ids.length };
    }
    if (action === 'classify') {
      await this._media.model.libraryMedia.updateMany({
        where: { id: { in: ids } },
        data: {
          ...(payload.nicheId ? { nicheId: payload.nicheId } : {}),
          ...(payload.segmentId ? { segmentId: payload.segmentId } : {}),
          ...(payload.categoryId ? { categoryId: payload.categoryId } : {}),
          ...(payload.packId ? { packId: payload.packId } : {}),
        },
      });
      return { ok: true, affected: ids.length };
    }
    if (action === 'deactivate') {
      await this._media.model.libraryMedia.updateMany({
        where: { id: { in: ids } },
        data: { active: false },
      });
      return { ok: true, affected: ids.length };
    }
    throw new HttpException('Ação inválida', 400);
  }
}
