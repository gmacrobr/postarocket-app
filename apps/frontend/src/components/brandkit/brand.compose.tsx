'use client';

import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';

const btnFire = { background: 'linear-gradient(135deg,#FFC400,#FF6B00 45%,#E11D2E)' } as const;

// 9 posições possíveis para o logo
const POS: { key: string; label: string }[] = [
  { key: 'tl', label: '↖' }, { key: 'tc', label: '↑' }, { key: 'tr', label: '↗' },
  { key: 'ml', label: '←' }, { key: 'mc', label: '•' }, { key: 'mr', label: '→' },
  { key: 'bl', label: '↙' }, { key: 'bc', label: '↓' }, { key: 'br', label: '↘' },
];

interface Media { id: string; title: string; url: string; type: string }

export const BrandComposeModal: FC<{ media: Media; onClose: () => void }> = ({ media, onClose }) => {
  const fetch = useFetch();
  const toast = useToaster();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const kitReq = useSWR('/brand/kit', async (u) => (await fetch(u)).json());
  const kit: any = kitReq.data || {};

  const [logoKind, setLogoKind] = useState<'logoLight' | 'logoDark' | 'watermark' | 'none'>('logoLight');
  const [pos, setPos] = useState('br');
  const [size, setSize] = useState(18); // % da largura
  const [opacity, setOpacity] = useState(100);
  const [bar, setBar] = useState(true); // faixa de contato
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });

  const draw = useCallback(async () => {
    const cv = canvasRef.current;
    if (!cv) return;
    setReady(false);
    try {
      const base = await loadImg(media.url);
      cv.width = base.naturalWidth || 1080;
      cv.height = base.naturalHeight || 1350;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0, cv.width, cv.height);

      // Faixa de contato na base
      if (bar) {
        const contatos = [kit.whatsapp, kit.instagram, kit.website].filter(Boolean);
        if (contatos.length) {
          const h = Math.round(cv.height * 0.075);
          const grad = ctx.createLinearGradient(0, cv.height - h, 0, cv.height);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(0.35, (kit.colorPrimary || '#FF6B00') + 'ee');
          grad.addColorStop(1, (kit.colorSecondary || '#E11D2E') + 'ff');
          ctx.fillStyle = grad;
          ctx.fillRect(0, cv.height - h, cv.width, h);

          ctx.fillStyle = '#ffffff';
          ctx.font = `600 ${Math.round(h * 0.3)}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(contatos.join('   •   '), cv.width / 2, cv.height - h * 0.42);
        }
      }

      // Logo
      if (logoKind !== 'none' && kit[logoKind]) {
        const logo = await loadImg(kit[logoKind]);
        const w = (cv.width * size) / 100;
        const h = (logo.naturalHeight / logo.naturalWidth) * w;
        const m = cv.width * 0.04;
        const barH = bar ? cv.height * 0.075 : 0;
        const x =
          pos[1] === 'l' ? m : pos[1] === 'c' ? (cv.width - w) / 2 : cv.width - w - m;
        const y =
          pos[0] === 't' ? m : pos[0] === 'm' ? (cv.height - h) / 2 : cv.height - h - m - barH;
        ctx.globalAlpha = opacity / 100;
        ctx.drawImage(logo, x, y, w, h);
        ctx.globalAlpha = 1;
      }
      setReady(true);
    } catch {
      toast.show('Não foi possível carregar a imagem para composição', 'warning');
    }
  }, [media.url, kit, logoKind, pos, size, opacity, bar, toast]);

  useEffect(() => { if (kitReq.data) draw(); }, [kitReq.data, draw]);

  const salvar = useCallback(async (baixar: boolean) => {
    const cv = canvasRef.current;
    if (!cv) return;
    setBusy(true);
    try {
      const blob: Blob | null = await new Promise((r) => cv.toBlob((b) => r(b), 'image/png', 0.95));
      if (!blob) throw new Error('sem blob');

      if (baixar) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${(kit.tradeName || 'marca').toLowerCase().replace(/\s+/g, '-')}-${media.title}.png`;
        a.click();
        toast.show('Download iniciado! ⬇️', 'success');
      } else {
        const fd = new FormData();
        fd.append('file', new File([blob], `marca-${Date.now()}.png`, { type: 'image/png' }));
        const r = await fetch('/media/upload-server', { method: 'POST', body: fd as any } as any);
        const d = await r.json();
        if (d?.path || d?.url) toast.show('Salvo na sua Mídia! Pronto para agendar. 🚀', 'success');
        else toast.show('Falha ao salvar', 'warning');
      }
    } catch {
      toast.show('Erro ao gerar a imagem', 'warning');
    } finally { setBusy(false); }
  }, [kit, media.title, fetch, toast]);

  const semKit = !kit.logoLight && !kit.logoDark && !kit.watermark;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-[16px]"
      style={{ background: 'rgba(0,0,0,.75)' }} onClick={onClose}>
      <div className="rounded-[18px] w-full max-w-[880px] max-h-[92vh] overflow-auto"
        style={{ background: '#12081C', border: '1px solid rgba(255,107,0,.3)' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-[16px] border-b border-[rgba(255,255,255,.08)]">
          <div className="font-[800] text-[15px]">✨ Gerar com minha marca</div>
          <button onClick={onClose} className="text-[#7A6B95] text-[18px]">✕</button>
        </div>

        {semKit ? (
          <div className="p-[30px] text-center">
            <div className="text-[40px] mb-[8px]">🎨</div>
            <div className="font-[700] text-[15px]">Seu kit de marca está vazio</div>
            <div className="text-[13px] text-textItemBlur mt-[5px]">
              Cadastre sua logo e seus dados em <b>Minha Marca</b> para gerar artes personalizadas.
            </div>
            <a href="/minha-marca" className="inline-block mt-[14px] px-[20px] py-[10px] rounded-[11px] text-[13px] font-[700] text-white" style={btnFire}>
              Ir para Minha Marca
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-[16px] p-[16px]">
            {/* Preview */}
            <div className="rounded-[13px] overflow-hidden bg-[#0D0517] flex items-center justify-center" style={{ minHeight: 300 }}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '62vh', display: 'block' }} />
            </div>

            {/* Controles */}
            <div className="flex flex-col gap-[13px]">
              <div>
                <div className="text-[12px] text-[#B8A9CF] mb-[6px]">Qual logo</div>
                <div className="flex gap-[6px] flex-wrap">
                  {([['logoLight', 'Clara'], ['logoDark', 'Escura'], ['watermark', "D'água"], ['none', 'Sem logo']] as const)
                    .filter(([k]) => k === 'none' || kit[k])
                    .map(([k, l]) => (
                      <button key={k} onClick={() => setLogoKind(k as any)}
                        className="text-[11px] font-[600] px-[10px] py-[6px] rounded-[8px]"
                        style={logoKind === k
                          ? { background: 'rgba(255,107,0,.18)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
                          : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.12)' }}>
                        {l}
                      </button>
                    ))}
                </div>
              </div>

              {logoKind !== 'none' && (
                <>
                  <div>
                    <div className="text-[12px] text-[#B8A9CF] mb-[6px]">Posição</div>
                    <div className="grid grid-cols-3 gap-[4px]" style={{ width: 108 }}>
                      {POS.map((p) => (
                        <button key={p.key} onClick={() => setPos(p.key)}
                          className="rounded-[7px] text-[13px]"
                          style={{
                            height: 32,
                            background: pos === p.key ? 'rgba(255,107,0,.2)' : 'transparent',
                            border: `1px solid ${pos === p.key ? 'rgba(255,107,0,.6)' : 'rgba(255,255,255,.12)'}`,
                            color: pos === p.key ? '#FF8A3D' : '#7A6B95',
                          }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] text-[#B8A9CF] mb-[4px]">Tamanho: {size}%</div>
                    <input type="range" min={6} max={45} value={size} onChange={(e) => setSize(+e.target.value)}
                      style={{ width: '100%', accentColor: '#FF6B00' }} />
                  </div>

                  <div>
                    <div className="text-[12px] text-[#B8A9CF] mb-[4px]">Opacidade: {opacity}%</div>
                    <input type="range" min={20} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)}
                      style={{ width: '100%', accentColor: '#FF6B00' }} />
                  </div>
                </>
              )}

              <label className="flex items-center gap-[8px] text-[12px] text-[#B8A9CF] cursor-pointer">
                <input type="checkbox" checked={bar} onChange={(e) => setBar(e.target.checked)}
                  style={{ accentColor: '#FF6B00', width: 15, height: 15 }} />
                Faixa com meus contatos
              </label>

              <div className="text-[11px] text-[#7A6B95] leading-[1.5]">
                {[kit.whatsapp, kit.instagram, kit.website].filter(Boolean).join(' • ') || 'Preencha seus dados em Minha Marca'}
              </div>

              <div className="flex flex-col gap-[7px] mt-auto">
                <button onClick={() => salvar(false)} disabled={busy || !ready}
                  className="py-[11px] rounded-[11px] text-[13px] font-[700] text-white"
                  style={{ ...btnFire, opacity: busy || !ready ? 0.6 : 1 }}>
                  {busy ? 'Processando…' : '💾 Salvar na minha Mídia'}
                </button>
                <button onClick={() => salvar(true)} disabled={busy || !ready}
                  className="py-[10px] rounded-[11px] text-[12px] font-[700]"
                  style={{ border: '1px solid rgba(255,255,255,.15)', color: '#B8A9CF' }}>
                  ⬇️ Baixar no computador
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
