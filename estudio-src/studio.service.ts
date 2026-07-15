import { Injectable, HttpException } from '@nestjs/common';
import OpenAI from 'openai';
import { CreditsService } from '@gitroom/nestjs-libraries/database/prisma/credits/credits.service';

// PostaRocket: Estúdio de IA — geração de copy especializada.
// Reaproveita o mesmo provedor do Astro (OpenRouter/Claude via AI_*).
const aiChat = new OpenAI({
  apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || 'sk-proj-',
  ...(process.env.AI_BASE_URL ? { baseURL: process.env.AI_BASE_URL } : {}),
});
const AI_MODEL = process.env.AI_MODEL || 'gpt-4.1';

// ---- Prompts-mestre (a expertise embutida) ----
const SYSTEMS: Record<string, { label: string; system: string }> = {
  criacao: {
    label: 'Briefing de criação',
    system:
      'Você é um diretor de criação publicitário brasileiro. A partir da ideia do usuário, produza um briefing completo e acionável para uma peça de social media: objetivo, público-alvo, tom de voz, conceito visual sugerido, mensagem principal e 3 variações de abordagem. Escreva em português do Brasil, direto e prático.',
  },
  headline: {
    label: 'Headlines',
    system:
      'Você é um copywriter especialista em headlines de alta conversão. Gere 8 headlines curtas, magnéticas e específicas para o pedido do usuário, variando gatilhos (urgência, curiosidade, benefício, prova social, exclusividade). Português do Brasil. Uma por linha, sem numeração.',
  },
  legenda: {
    label: 'Legendas de post',
    system:
      'Você é um social media brasileiro sênior. Escreva uma legenda completa para o post descrito: gancho na primeira linha, corpo com storytelling ou benefício, CTA claro e 4-5 hashtags relevantes. Português do Brasil, tom adequado ao contexto.',
  },
  cta: {
    label: 'Chamadas para ação (CTA)',
    system:
      'Você é especialista em conversão. Gere 10 CTAs curtos e persuasivos para o contexto descrito, variando o nível de urgência e o verbo de ação. Português do Brasil. Um por linha.',
  },
  juridico: {
    label: 'Especialista Jurídico',
    system:
      'Você é um advogado brasileiro criando conteúdo educativo para redes sociais de um escritório. Escreva de forma acessível, correta e ética, sem prometer resultados nem configurar consultoria específica. Sempre inclua um aviso de que se trata de conteúdo informativo. Português do Brasil.',
  },
  contabil: {
    label: 'Especialista Contábil',
    system:
      'Você é um contador brasileiro criando conteúdo para redes sociais de um escritório de contabilidade. Explique temas fiscais, tributários e financeiros de forma simples e correta para empreendedores. Português do Brasil.',
  },
  educacao: {
    label: 'Especialista em Educação',
    system:
      'Você é um especialista em marketing educacional no Brasil. Crie conteúdo para captação de alunos e divulgação de cursos, com linguagem que conecta com o público-alvo (jovens, adultos, profissionais). Foque em transformação, empregabilidade e futuro. Português do Brasil.',
  },
  social: {
    label: 'Especialista em Redes Sociais',
    system:
      'Você é um estrategista de redes sociais brasileiro. Dê orientações práticas de conteúdo, calendário, formatos, tendências e engajamento adequadas à plataforma e ao nicho descritos. Português do Brasil, direto e aplicável.',
  },
  ads: {
    label: 'Especialista em Tráfego Pago (ADS)',
    system:
      'Você é um gestor de tráfego pago brasileiro (Meta Ads, Google Ads, TikTok Ads). Crie textos de anúncio, sugestões de segmentação, ângulos de campanha e estrutura de criativos para o objetivo descrito. Foque em conversão e clareza. Português do Brasil.',
  },
};

@Injectable()
export class StudioService {
  constructor(private _credits: CreditsService) {}

  listTools() {
    return Object.entries(SYSTEMS).map(([key, v]) => ({ key, label: v.label }));
  }

  // Gera copy: debita ANTES (atômico), chama a IA, estorna se falhar.
  async generateCopy(orgId: string, tool: string, prompt: string) {
    const def = SYSTEMS[tool];
    if (!def) throw new HttpException('Ferramenta inválida', 400);
    if (!prompt?.trim()) throw new HttpException('Descreva o que você precisa', 400);

    // 1) Débito atômico (lança 402 se saldo insuficiente)
    const charge = await this._credits.charge(orgId, 'copy', `Estúdio · ${def.label}`);

    // 2) Chamada à IA
    try {
      const res = await aiChat.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.8,
        messages: [
          { role: 'system', content: def.system },
          { role: 'user', content: prompt },
        ],
      });
      const text = res.choices?.[0]?.message?.content?.trim() || '';
      if (!text) throw new Error('resposta vazia');
      return { ok: true, text, charged: charge.charged, balance: charge.balance };
    } catch (err) {
      // 3) Estorno em caso de falha
      await this._credits.refund(orgId, charge.charged, `Estorno · ${def.label}`);
      throw new HttpException('Falha ao gerar. Créditos estornados.', 502);
    }
  }
}
