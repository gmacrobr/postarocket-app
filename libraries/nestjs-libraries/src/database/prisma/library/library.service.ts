import { Injectable } from '@nestjs/common';
import { LibraryRepository } from '@gitroom/nestjs-libraries/database/prisma/library/library.repository';

// PostaRocket: serviço da Biblioteca Rocket
@Injectable()
export class LibraryService {
  constructor(private _libraryRepository: LibraryRepository) {}

  getNiches(onlyActive = true) {
    return this._libraryRepository.getNiches(onlyActive);
  }
  createNiche(data: any) {
    return this._libraryRepository.createNiche(data);
  }
  updateNiche(id: string, data: any) {
    return this._libraryRepository.updateNiche(id, data);
  }
  deleteNiche(id: string) {
    return this._libraryRepository.deleteNiche(id);
  }

  getMedias(filter: { nicheId?: string; category?: string }) {
    return this._libraryRepository.getMedias(filter);
  }
  createMedia(data: any) {
    return this._libraryRepository.createMedia(data);
  }
  deleteMedia(id: string) {
    return this._libraryRepository.deleteMedia(id);
  }

  getAds(filter: { nicheId?: string; category?: string }) {
    return this._libraryRepository.getAds(filter);
  }
  createAd(data: any) {
    return this._libraryRepository.createAd(data);
  }
  deleteAd(id: string) {
    return this._libraryRepository.deleteAd(id);
  }
}
