import { Injectable, HttpException } from '@nestjs/common';
import OpenAI from 'openai';
import { CreditsService } from '@gitroom/nestjs-libraries/database/prisma/credits/credits.service';
import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { UploadFactory } from '@gitroom/nestjs-libraries/upload/upload.factory';

// PostaRocket: Estúdio de IA — geração de imagens (C3).
// Model-agnostic via tabela ImageModel. Começa com OpenAI (GPT Image).
const imageClient = new OpenAI({
  apiKey: process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY || 'sk-proj-',
  ...(process.env.IMAGE_BASE_URL ? { baseURL: process.env.IMAGE_BASE_URL } : {}),
});

// mapa de formato -> tamanho aceito pela OpenAI
const SIZES: Record<string, string> = {
  feed: '1024x1536',     // 2:3 (retrato, aprox. 1080x1350)
  vertical: '1024x1536', // 9:16 aproximado (OpenAI usa 1024x1536 p/ retrato)
  quadrado: '1024x1024',
  horizontal: '1536x1024',
};

@Injectable()
export class ImageStudioService {
  private _storage: any = null;
  private get storage() {
    if (!this._storage) {
      this._storage = UploadFactory.createStorage();
    }
    return this._storage;
  }

  constructor(
    private _credits: CreditsService,
    private _models: PrismaRepository<'imageModel'>
  ) {}

  listModels(onlyActive = true) {
    return this._models.model.imageModel.findMany({
      ...(onlyActive ? { where: { active: true } } : {}),
      orderBy: { order: 'asc' },
    });
  }

  createModel(data: any) {
    return this._models.model.imageModel.create({ data });
  }
  updateModel(id: string, data: any) {
    return this._models.model.imageModel.update({ where: { id }, data });
  }
  deleteModel(id: string) {
    return this._models.model.imageModel.delete({ where: { id } });
  }

  // Semear os 3 tiers padrão (idempotente)
  async seedDefaults() {
    const count = await this._models.model.imageModel.count();
    if (count === 0) {
      await this._models.model.imageModel.createMany({
        data: [
          { key: 'rapido', label: '⚡ Rápido', provider: 'openai', model: 'gpt-image-1', quality: 'low', cost: 25, order: 1 },
          { key: 'equilibrado', label: '⭐ Equilibrado', provider: 'openai', model: 'gpt-image-1', quality: 'medium', cost: 50, order: 2 },
          { key: 'premium', label: '💎 Premium', provider: 'openai', model: 'gpt-image-1', quality: 'high', cost: 90, order: 3 },
        ],
      });
    }
    return { ok: true };
  }

  // Gerar imagem: debita, chama a IA, salva no R2, estorna se falhar.
  async generate(orgId: string, modelKey: string, prompt: string, format = 'feed') {
    if (!prompt?.trim()) throw new HttpException('Descreva a imagem', 400);
    const model = await this._models.model.imageModel.findUnique({ where: { key: modelKey } });
    if (!model || !model.active) throw new HttpException('Modelo indisponível', 400);

    // 1) Débito atômico pelo custo EXATO do modelo escolhido
    const charge = await this._credits.chargeCustom(
      orgId,
      model.cost,
      'imagem',
      `Estúdio · Imagem (${model.label})`
    );

    // 2) Geração
    try {
      const size = SIZES[format] || SIZES.feed;
      const res = await imageClient.images.generate({
        model: model.model,
        prompt,
        size: size as any,
        quality: (model.quality || 'medium') as any,
        n: 1,
      });

      const b64 = res.data?.[0]?.b64_json;
      const url = res.data?.[0]?.url;
      let dataUrl: string;
      if (b64) dataUrl = `data:image/png;base64,${b64}`;
      else if (url) dataUrl = url;
      else throw new Error('sem imagem');

      // 3) Salvar no R2 (vira URL de mídia)
      const saved = await this.storage.uploadSimple(dataUrl);

      return { ok: true, url: saved, charged: model.cost, balance: charge.balance };
    } catch (err) {
      // 4) Estorno total em caso de falha
      await this._credits.refund(orgId, model.cost, `Estorno · Imagem (${model.label})`);
      throw new HttpException('Falha ao gerar a imagem. Créditos estornados.', 502);
    }
  }
}
