import { Injectable } from '@nestjs/common';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

// PostaRocket: repositório da Biblioteca Rocket
@Injectable()
export class LibraryRepository {
  constructor(
    private _niche: PrismaRepository<'libraryNiche'>,
    private _media: PrismaRepository<'libraryMedia'>,
    private _ad: PrismaRepository<'libraryAd'>
  ) {}

  // ---------- Nichos ----------
  getNiches(onlyActive = true) {
    return this._niche.model.libraryNiche.findMany({
      ...(onlyActive ? { where: { active: true } } : {}),
      orderBy: { order: 'asc' },
    });
  }

  createNiche(data: {
    name: string;
    slug: string;
    icon?: string;
    description?: string;
    order?: number;
  }) {
    return this._niche.model.libraryNiche.create({ data });
  }

  updateNiche(id: string, data: any) {
    return this._niche.model.libraryNiche.update({ where: { id }, data });
  }

  deleteNiche(id: string) {
    return this._niche.model.libraryNiche.delete({ where: { id } });
  }

  // ---------- Mídias ----------
  getMedias(filter: { nicheId?: string; category?: string }) {
    return this._media.model.libraryMedia.findMany({
      where: {
        active: true,
        ...(filter.nicheId ? { nicheId: filter.nicheId } : {}),
        ...(filter.category ? { category: filter.category } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { niche: true },
    });
  }

  createMedia(data: any) {
    return this._media.model.libraryMedia.create({ data });
  }

  deleteMedia(id: string) {
    return this._media.model.libraryMedia.delete({ where: { id } });
  }

  // ---------- Anúncios prontos ----------
  getAds(filter: { nicheId?: string; category?: string }) {
    return this._ad.model.libraryAd.findMany({
      where: {
        active: true,
        ...(filter.nicheId ? { nicheId: filter.nicheId } : {}),
        ...(filter.category ? { category: filter.category } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { niche: true },
    });
  }

  createAd(data: any) {
    return this._ad.model.libraryAd.create({ data });
  }

  deleteAd(id: string) {
    return this._ad.model.libraryAd.delete({ where: { id } });
  }
}
