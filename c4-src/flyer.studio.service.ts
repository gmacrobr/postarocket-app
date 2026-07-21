import { Injectable, HttpException } from '@nestjs/common';
import OpenAI from 'openai';
import { CreditsService } from '@gitroom/nestjs-libraries/database/prisma/credits/credits.service';

// PostaRocket: Estúdio de Flyers (C4)
// A IA estrutura o conteúdo; a composição visual acontece no navegador.
const aiChat = new OpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || 'sk-proj-',
  ...(process.env.AI_BASE_URL ? { baseURL: process.env.AI_BASE_URL } : {}),
});
const AI_MODEL = process.env.AI_MODEL || 'gpt-4.1';

const SYSTEM = `Você é um diretor de arte publicitário brasileiro especializado em panfletos e flyers comerciais.
A partir do pedido do usuário, estruture o conteúdo de UM flyer profissional.

Responda APENAS com um objeto JSON válido, sem markdown, sem crases, sem explicação. Formato exato:
{
  "titulo": "string curta e impactante (máx 30 caracteres)",
  "subtitulo": "string de apoio (máx 60 caracteres)",
  "destaque": "a oferta/preço principal em destaque, ex: 'R$ 39,90' ou '50% OFF' (máx 18 caracteres, use string vazia se não houver)",
  "itens": ["3 a 5 bullets curtos, máx 40 caracteres cada"],
  "cta": "chamada para ação curta (máx 35 caracteres)",
  "rodape": "informação complementar curta, ex: validade ou condição (máx 60 caracteres)"
}

Regras: português do Brasil, linguagem comercial persuasiva e direta. Nunca invente telefone, endereço ou @ — esses dados entram automaticamente depois.`;

@Injectable()
export class FlyerStudioService {
  constructor(private _credits: CreditsService) {}

  async generate(orgId: string, prompt: string) {
    if (!prompt?.trim()) throw new HttpException('Descreva o flyer que você precisa', 400);

    // Débito atômico (custo da ação "flyer")
    const charge = await this._credits.charge(orgId, 'flyer', 'Estúdio · Flyer');

    try {
      const res = await aiChat.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.8,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
      });

      const raw = res.choices?.[0]?.message?.content?.trim() || '';
      const clean = raw.replace(/```json|```/g, '').trim();
      let data: any;
      try {
        data = JSON.parse(clean);
      } catch {
        const m = clean.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('json inválido');
        data = JSON.parse(m[0]);
      }

      // Normaliza para o frontend nunca quebrar
      const flyer = {
        titulo: String(data.titulo || '').slice(0, 40),
        subtitulo: String(data.subtitulo || '').slice(0, 80),
        destaque: String(data.destaque || '').slice(0, 24),
        itens: Array.isArray(data.itens) ? data.itens.slice(0, 5).map((i: any) => String(i).slice(0, 50)) : [],
        cta: String(data.cta || '').slice(0, 45),
        rodape: String(data.rodape || '').slice(0, 80),
      };

      return { ok: true, flyer, charged: charge.charged, balance: charge.balance };
    } catch (err) {
      await this._credits.refund(orgId, charge.charged, 'Estorno · Flyer');
      throw new HttpException('Falha ao gerar o flyer. Créditos estornados.', 502);
    }
  }
}
