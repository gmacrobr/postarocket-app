'use client';

import React, { FC, useCallback, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';

const fire: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg,#FFC400 0%,#FF6B00 45%,#E11D2E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

interface Model { id: string; key: string; label: string; cost: number }

const FORMATS = [
  { key: 'feed', label: 'Feed (retrato)', ratio: '2:3' },
  { key: 'quadrado', label: 'Quadrado', ratio: '1:1' },
  { key: 'horizontal', label: 'Horizontal', ratio: '3:2' },
];

export const ImageStudioComponent: FC = () => {
  const fetch = useFetch();
  const toast = useToaster();

  const modelsReq = useSWR('/studio/image/models', async (u) => (await fetch(u)).json());
  const walletReq = useSWR('/credits/wallet', async (u) => (await fetch(u)).json());
  const models: Model[] = modelsReq.data || [];
  const balance = walletReq.data?.balance ?? 0;

  const [model, setModel] = useState('');
  const [format, setFormat] = useState('feed');
  const [prompt, setPrompt] = useState('');
  const [img, setImg] = useState('');
  const [loading, setLoading] = useState(false);

  const chosen = models.find((m) => m.key === (model || models[0]?.key));
  const cost = chosen?.cost ?? 0;

  const gerar = useCallback(async () => {
    if (!prompt.trim()) { toast.show('Descreva a imagem que você quer', 'warning'); return; }
    const mk = model || models[0]?.key;
    if (!mk) { toast.show('Nenhum modelo disponível', 'warning'); return; }
    setLoading(true); setImg('');
    try {
      const r = await fetch('/studio/image/generate', {
        method: 'POST',
        body: JSON.stringify({ model: mk, prompt, format }),
      });
      if (r.status === 402) {
        toast.show('Créditos insuficientes. Recarregue 💳', 'warning');
        return;
      }
      const d = await r.json();
      if (d.url) {
        setImg(d.url);
        walletReq.mutate();
        toast.show(`Imagem gerada! −${d.charged} créditos · saldo ${d.balance}`, 'success');
      } else {
        toast.show('Falha ao gerar. Tente novamente.', 'warning');
      }
    } catch {
      toast.show('Erro na geração.', 'warning');
    } finally {
      setLoading(false);
    }
  }, [prompt, model, models, format, fetch, toast, walletReq]);

  return (
    <div className="flex flex-1 flex-col p-[8px] gap-[18px]">
      <div className="flex items-center justify-between flex-wrap gap-[10px]">
        <div>
          <div className="text-[26px] font-[900] italic leading-[1.1]">
            Estúdio de <span style={fire}>Imagens</span>
          </div>
          <div className="text-[13px] text-textItemBlur mt-[2px]">
            Imagens profissionais por IA — salvas direto na sua biblioteca de mídia. 🖼️
          </div>
        </div>
        <div className="rounded-[12px] px-[16px] py-[9px] text-[13px]" style={{ background: 'rgba(255,107,0,.12)', border: '1px solid rgba(255,107,0,.35)' }}>
          💰 <b style={{ color: '#FF8A3D' }}>{balance.toLocaleString('pt-BR')}</b> créditos
        </div>
      </div>

      {/* Seletor de modelo (tiers) */}
      <div>
        <div className="text-[12px] text-[#7A6B95] mb-[7px]">Qualidade da IA</div>
        <div className="flex gap-[8px] flex-wrap">
          {models.map((m) => (
            <button
              key={m.key}
              onClick={() => setModel(m.key)}
              className="px-[16px] py-[10px] rounded-[12px] text-[13px] font-[600] transition-colors"
              style={(model || models[0]?.key) === m.key
                ? { background: 'rgba(255,107,0,.15)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
                : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.1)' }}
            >
              {m.label} · {m.cost} créd.
            </button>
          ))}
        </div>
      </div>

      {/* Formato */}
      <div>
        <div className="text-[12px] text-[#7A6B95] mb-[7px]">Formato</div>
        <div className="flex gap-[8px] flex-wrap">
          {FORMATS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFormat(f.key)}
              className="px-[14px] py-[9px] rounded-[11px] text-[13px] font-[600] transition-colors"
              style={format === f.key
                ? { background: 'rgba(255,107,0,.15)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
                : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.1)' }}
            >
              {f.label} <span style={{ color: '#7A6B95' }}>{f.ratio}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Entrada */}
      <div className="rounded-[16px] p-[18px] bg-[#1A0D2B] border border-[rgba(255,107,0,.25)]">
        <div className="text-[12px] text-[#7A6B95] mb-[7px]">
          Descreva a imagem — cenário, estilo, cores, clima (sem texto na imagem funciona melhor)
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: barbearia moderna, cadeira de couro sob luz quente, ambiente urbano premium, fotografia realista, sem texto"
          className="w-full bg-[#12081C] border border-[rgba(255,255,255,.12)] rounded-[12px] p-[14px] text-[13px] text-white"
          style={{ minHeight: 80, resize: 'vertical' }}
        />
        <div className="flex justify-between items-center mt-[12px] flex-wrap gap-[10px]">
          <span className="text-[12px] text-[#7A6B95]">custo: <b style={{ color: '#FF8A3D' }}>{cost} créditos</b></span>
          <button
            onClick={gerar}
            disabled={loading}
            className="px-[22px] py-[11px] rounded-[12px] text-[14px] font-[700] text-white"
            style={{ background: 'linear-gradient(135deg,#FFC400,#FF6B00 45%,#E11D2E)', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Gerando… (pode levar até 30s)' : '✨ Gerar imagem'}
          </button>
        </div>
      </div>

      {/* Resultado */}
      {img && (
        <div className="rounded-[16px] p-[18px] bg-[#12081C] border border-[rgba(59,214,113,.3)]">
          <div className="flex justify-between items-center mb-[12px]">
            <div className="text-[13px] font-[700]" style={{ color: '#5fe08d' }}>✅ Imagem gerada · salva em Mídia</div>
            <a href={img} download target="_blank" rel="noreferrer" className="text-[12px] font-[700] px-[14px] py-[7px] rounded-[9px] text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#E11D2E)' }}>
              ⬇️ Baixar
            </a>
          </div>
          <img src={img} alt="Imagem gerada" className="rounded-[12px] max-w-full" style={{ maxHeight: 520 }} />
        </div>
      )}
    </div>
  );
};
