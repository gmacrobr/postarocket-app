'use client';

import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';

const fire: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg,#FFC400 0%,#FF6B00 45%,#E11D2E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};
const btnFire = { background: 'linear-gradient(135deg,#FFC400,#FF6B00 45%,#E11D2E)' } as const;
const inp =
  'w-full bg-[#12081C] border border-[rgba(255,255,255,.12)] rounded-[9px] px-[11px] py-[8px] text-[13px] text-white';

interface Flyer {
  titulo: string; subtitulo: string; destaque: string;
  itens: string[]; cta: string; rodape: string;
}

const FORMATOS = [
  { key: 'feed', label: 'Feed 4:5', w: 1080, h: 1350 },
  { key: 'story', label: 'Story 9:16', w: 1080, h: 1920 },
  { key: 'a4', label: 'A4 impressão', w: 1240, h: 1754 },
];

export const FlyerStudioComponent: FC = () => {
  const fetch = useFetch();
  const toast = useToaster();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const kitReq = useSWR('/brand/kit', async (u) => (await fetch(u)).json());
  const walletReq = useSWR('/credits/wallet', async (u) => (await fetch(u)).json());
  const kit: any = kitReq.data || {};
  const balance = walletReq.data?.balance ?? 0;

  const [prompt, setPrompt] = useState('');
  const [flyer, setFlyer] = useState<Flyer | null>(null);
  const [formato, setFormato] = useState('feed');
  const [bgUrl, setBgUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });

  const gerar = useCallback(async () => {
    if (!prompt.trim()) { toast.show('Descreva o flyer que você precisa', 'warning'); return; }
    setLoading(true);
    try {
      const r = await fetch('/studio/flyer/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
      });
      if (r.status === 402) { toast.show('Créditos insuficientes. Recarregue 💳', 'warning'); return; }
      const d = await r.json();
      if (d?.flyer) {
        setFlyer(d.flyer);
        walletReq.mutate();
        toast.show(`Flyer criado! −${d.charged} créditos · saldo ${d.balance}`, 'success');
      } else toast.show('Falha ao gerar. Tente novamente.', 'warning');
    } catch { toast.show('Erro na geração.', 'warning'); }
    finally { setLoading(false); }
  }, [prompt, fetch, toast, walletReq]);

  // Desenha o flyer no canvas
  const draw = useCallback(async () => {
    const cv = canvasRef.current;
    if (!cv || !flyer) return;
    const fmt = FORMATOS.find((f) => f.key === formato) || FORMATOS[0];
    cv.width = fmt.w; cv.height = fmt.h;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const c1 = kit.colorPrimary || '#FF6B00';
    const c2 = kit.colorSecondary || '#E11D2E';
    const c3 = kit.colorAccent || '#FFC400';
    const W = cv.width, H = cv.height;

    // Fundo
    if (bgUrl) {
      try {
        const bg = await loadImg(bgUrl);
        ctx.drawImage(bg, 0, 0, W, H);
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(0, 0, W, H);
      } catch {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, c1); g.addColorStop(1, c2);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    // Faixa diagonal decorativa
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = c3;
    ctx.beginPath();
    ctx.moveTo(W * 0.55, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * 0.32); ctx.closePath();
    ctx.fill();
    ctx.restore();

    const pad = W * 0.09;
    let y = H * 0.16;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Logo (topo esquerdo)
    const logoSrc = kit.logoDark || kit.logoLight;
    if (logoSrc) {
      try {
        const lg = await loadImg(logoSrc);
        const lw = W * 0.24;
        const lh = (lg.naturalHeight / lg.naturalWidth) * lw;
        ctx.drawImage(lg, pad, H * 0.05, lw, lh);
      } catch {}
    }

    // Título
    ctx.fillStyle = '#ffffff';
    const tSize = Math.round(W * 0.095);
    ctx.font = `900 ${tSize}px Arial, sans-serif`;
    const linhas = wrap(ctx, (flyer.titulo || '').toUpperCase(), W - pad * 2);
    linhas.forEach((ln) => { ctx.fillText(ln, pad, y); y += tSize * 1.06; });

    // Subtítulo
    if (flyer.subtitulo) {
      y += H * 0.012;
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      const sSize = Math.round(W * 0.037);
      ctx.font = `500 ${sSize}px Arial, sans-serif`;
      wrap(ctx, flyer.subtitulo, W - pad * 2).forEach((ln) => { ctx.fillText(ln, pad, y); y += sSize * 1.3; });
    }

    // Destaque (preço/oferta)
    if (flyer.destaque) {
      y += H * 0.03;
      const dSize = Math.round(W * 0.115);
      ctx.font = `900 ${dSize}px Arial, sans-serif`;
      const tw = ctx.measureText(flyer.destaque).width;
      const bw = tw + W * 0.07, bh = dSize * 1.3;
      ctx.fillStyle = c3;
      roundRect(ctx, pad, y, bw, bh, bh * 0.18);
      ctx.fill();
      ctx.fillStyle = '#1a0d0d';
      ctx.fillText(flyer.destaque, pad + W * 0.035, y + bh * 0.14);
      y += bh + H * 0.025;
    }

    // Itens
    if (flyer.itens?.length) {
      y += H * 0.015;
      const iSize = Math.round(W * 0.034);
      ctx.font = `600 ${iSize}px Arial, sans-serif`;
      flyer.itens.forEach((it) => {
        ctx.fillStyle = c3;
        ctx.beginPath();
        ctx.arc(pad + iSize * 0.35, y + iSize * 0.55, iSize * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        ctx.fillText(it, pad + iSize * 0.95, y);
        y += iSize * 1.75;
      });
    }

    // CTA
    if (flyer.cta) {
      const cSize = Math.round(W * 0.042);
      ctx.font = `800 ${cSize}px Arial, sans-serif`;
      const cw = ctx.measureText(flyer.cta.toUpperCase()).width + W * 0.09;
      const ch = cSize * 2.1;
      const cy = H * 0.80 - ch;
      ctx.fillStyle = '#ffffff';
      roundRect(ctx, pad, cy, cw, ch, ch * 0.5);
      ctx.fill();
      ctx.fillStyle = c2;
      ctx.fillText(flyer.cta.toUpperCase(), pad + W * 0.045, cy + ch * 0.28);
    }

    // Rodapé com contatos da marca
    const contatos = [kit.whatsapp, kit.instagram, kit.website, kit.address].filter(Boolean);
    const fh = H * 0.115;
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, H - fh, W, fh);

    let fy = H - fh + fh * 0.2;
    if (flyer.rodape) {
      ctx.fillStyle = c3;
      const rSize = Math.round(W * 0.026);
      ctx.font = `600 ${rSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(flyer.rodape, W / 2, fy);
      fy += rSize * 1.5;
    }
    if (contatos.length) {
      ctx.fillStyle = '#ffffff';
      const kSize = Math.round(W * 0.028);
      ctx.font = `700 ${kSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(contatos.slice(0, 3).join('   •   '), W / 2, fy);
    }
    ctx.textAlign = 'left';
  }, [flyer, formato, kit, bgUrl]);

  useEffect(() => { draw(); }, [draw]);

  const salvar = useCallback(async (baixar: boolean) => {
    const cv = canvasRef.current;
    if (!cv || !flyer) return;
    setBusy(true);
    try {
      const blob: Blob | null = await new Promise((r) => cv.toBlob((b) => r(b), 'image/png', 0.95));
      if (!blob) throw new Error();
      if (baixar) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `flyer-${Date.now()}.png`;
        a.click();
        toast.show('Download iniciado! ⬇️', 'success');
      } else {
        const fd = new FormData();
        fd.append('file', new File([blob], `flyer-${Date.now()}.png`, { type: 'image/png' }));
        const r = await fetch('/media/upload-server', { method: 'POST', body: fd as any } as any);
        const d = await r.json();
        if (d?.path || d?.url) toast.show('Flyer salvo na sua Mídia! 🚀', 'success');
        else toast.show('Falha ao salvar', 'warning');
      }
    } catch { toast.show('Erro ao gerar o arquivo', 'warning'); }
    finally { setBusy(false); }
  }, [flyer, fetch, toast]);

  const editar = (campo: keyof Flyer, valor: any) =>
    setFlyer((f) => (f ? { ...f, [campo]: valor } : f));

  return (
    <div className="flex flex-1 flex-col p-[8px] gap-[16px]">
      <div className="flex items-start justify-between flex-wrap gap-[12px]">
        <div>
          <div className="text-[26px] font-[900] italic leading-[1.1]">
            Estúdio de <span style={fire}>Flyers</span>
          </div>
          <div className="text-[13px] text-textItemBlur mt-[2px]">
            Descreva a oferta — a IA monta o panfleto com a sua marca. 📄
          </div>
        </div>
        <div className="rounded-[12px] px-[16px] py-[9px] text-[13px]"
          style={{ background: 'rgba(255,107,0,.12)', border: '1px solid rgba(255,107,0,.35)' }}>
          💰 <b style={{ color: '#FF8A3D' }}>{balance.toLocaleString('pt-BR')}</b> créditos
        </div>
      </div>

      {/* Briefing */}
      <div className="rounded-[16px] p-[16px] bg-[#1A0D2B] border border-[rgba(255,107,0,.25)]">
        <div className="text-[12px] text-[#7A6B95] mb-[7px]">
          O que você quer anunciar? Quanto mais detalhe, melhor.
        </div>
        <textarea className={inp} style={{ minHeight: 78, resize: 'vertical' }}
          placeholder="Ex: promoção de terça na hamburgueria, 2 hambúrgueres artesanais + batata por R$ 39,90, válido só no salão, público jovem"
          value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="flex justify-between items-center mt-[11px] flex-wrap gap-[10px]">
          <span className="text-[12px] text-[#7A6B95]">custo: <b style={{ color: '#FF8A3D' }}>30 créditos</b></span>
          <button onClick={gerar} disabled={loading}
            className="px-[22px] py-[11px] rounded-[12px] text-[14px] font-[700] text-white"
            style={{ ...btnFire, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Criando…' : '✨ Criar flyer'}
          </button>
        </div>
      </div>

      {flyer && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] gap-[16px]">
          {/* Preview */}
          <div className="rounded-[15px] bg-[#0D0517] p-[12px] flex items-center justify-center">
            <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '68vh', borderRadius: 8 }} />
          </div>

          {/* Edição */}
          <div className="flex flex-col gap-[11px]">
            <div>
              <div className="text-[12px] text-[#B8A9CF] mb-[5px]">Formato</div>
              <div className="flex gap-[5px] flex-wrap">
                {FORMATOS.map((f) => (
                  <button key={f.key} onClick={() => setFormato(f.key)}
                    className="text-[11px] font-[600] px-[10px] py-[6px] rounded-[8px]"
                    style={formato === f.key
                      ? { background: 'rgba(255,107,0,.18)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
                      : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.12)' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[12px] text-[#B8A9CF] mb-[4px]">Imagem de fundo (opcional)</div>
              <input className={inp} placeholder="Cole a URL de uma imagem" value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} />
              <div className="text-[10px] text-[#7A6B95] mt-[3px]">Sem imagem, usa o gradiente das suas cores.</div>
            </div>

            <div className="h-[1px] bg-[rgba(255,255,255,.08)]" />
            <div className="text-[12px] font-[700] text-[#D6C9EC]">✏️ Ajuste os textos</div>

            <input className={inp} value={flyer.titulo} onChange={(e) => editar('titulo', e.target.value)} placeholder="Título" />
            <input className={inp} value={flyer.subtitulo} onChange={(e) => editar('subtitulo', e.target.value)} placeholder="Subtítulo" />
            <input className={inp} value={flyer.destaque} onChange={(e) => editar('destaque', e.target.value)} placeholder="Destaque (preço/oferta)" />
            {flyer.itens.map((it, i) => (
              <input key={i} className={inp} value={it} placeholder={`Item ${i + 1}`}
                onChange={(e) => editar('itens', flyer.itens.map((x, j) => (j === i ? e.target.value : x)))} />
            ))}
            <input className={inp} value={flyer.cta} onChange={(e) => editar('cta', e.target.value)} placeholder="Chamada (CTA)" />
            <input className={inp} value={flyer.rodape} onChange={(e) => editar('rodape', e.target.value)} placeholder="Rodapé" />

            <div className="flex flex-col gap-[7px] mt-[5px]">
              <button onClick={() => salvar(false)} disabled={busy}
                className="py-[11px] rounded-[11px] text-[13px] font-[700] text-white"
                style={{ ...btnFire, opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Processando…' : '💾 Salvar na minha Mídia'}
              </button>
              <button onClick={() => salvar(true)} disabled={busy}
                className="py-[10px] rounded-[11px] text-[12px] font-[700]"
                style={{ border: '1px solid rgba(255,255,255,.15)', color: '#B8A9CF' }}>
                ⬇️ Baixar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// utilitários de desenho
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const words = (text || '').split(' ');
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) { out.push(line); line = w; }
    else line = t;
  }
  if (line) out.push(line);
  return out;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
