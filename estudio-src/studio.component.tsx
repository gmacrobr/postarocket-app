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

const ICON: Record<string, string> = {
  criacao: '📝', headline: '🔥', legenda: '✍️', cta: '🎯',
  juridico: '⚖️', contabil: '📊', educacao: '🎓', social: '📱', ads: '📢',
};

interface Tool { key: string; label: string }

export const StudioComponent: FC = () => {
  const fetch = useFetch();
  const toast = useToaster();

  const toolsReq = useSWR('/studio/tools', async (u) => (await fetch(u)).json());
  const walletReq = useSWR('/credits/wallet', async (u) => (await fetch(u)).json());
  const tools: Tool[] = toolsReq.data || [];
  const balance = walletReq.data?.balance ?? 0;

  const [tool, setTool] = useState('legenda');
  const [prompt, setPrompt] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);

  const gerar = useCallback(async () => {
    if (!prompt.trim()) { toast.show('Descreva o que você precisa', 'warning'); return; }
    setLoading(true); setOut('');
    try {
      const r = await fetch('/studio/copy', {
        method: 'POST',
        body: JSON.stringify({ tool, prompt }),
      });
      if (r.status === 402) {
        toast.show('Créditos insuficientes. Recarregue para continuar. 💳', 'warning');
        return;
      }
      const d = await r.json();
      if (d.text) {
        setOut(d.text);
        walletReq.mutate();
        toast.show(`Pronto! −${d.charged} créditos · saldo ${d.balance}`, 'success');
      } else {
        toast.show('Falha ao gerar. Tente novamente.', 'warning');
      }
    } catch {
      toast.show('Erro na geração.', 'warning');
    } finally {
      setLoading(false);
    }
  }, [tool, prompt, fetch, toast, walletReq]);

  const copyOut = () => { navigator.clipboard.writeText(out); toast.show('Copiado! ✨', 'success'); };

  return (
    <div className="flex flex-1 flex-col p-[8px] gap-[18px]">
      <div className="flex items-center justify-between flex-wrap gap-[10px]">
        <div>
          <div className="text-[26px] font-[900] italic leading-[1.1]">
            Estúdio de <span style={fire}>IA</span>
          </div>
          <div className="text-[13px] text-textItemBlur mt-[2px]">
            Copy profissional para o seu negócio, em segundos. ✍️
          </div>
        </div>
        <div className="rounded-[12px] px-[16px] py-[9px] text-[13px]" style={{ background: 'rgba(255,107,0,.12)', border: '1px solid rgba(255,107,0,.35)' }}>
          💰 <b style={{ color: '#FF8A3D' }}>{balance.toLocaleString('pt-BR')}</b> créditos
        </div>
      </div>

      {/* Ferramentas */}
      <div className="flex gap-[8px] flex-wrap">
        {tools.map((t) => (
          <button
            key={t.key}
            onClick={() => setTool(t.key)}
            className="px-[14px] py-[9px] rounded-[11px] text-[13px] font-[600] transition-colors"
            style={tool === t.key
              ? { background: 'rgba(255,107,0,.15)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
              : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.1)' }}
          >
            {ICON[t.key] || '✨'} {t.label}
          </button>
        ))}
      </div>

      {/* Entrada */}
      <div className="rounded-[16px] p-[18px] bg-[#1A0D2B] border border-[rgba(255,107,0,.25)]">
        <div className="text-[12px] text-[#7A6B95] mb-[7px]">
          Descreva o que você precisa — quanto mais contexto, melhor o resultado
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: post de matrícula para o curso Técnico em Enfermagem, público jovem 18-25, tom motivacional, foco em empregabilidade"
          className="w-full bg-[#12081C] border border-[rgba(255,255,255,.12)] rounded-[12px] p-[14px] text-[13px] text-white"
          style={{ minHeight: 90, resize: 'vertical' }}
        />
        <div className="flex justify-between items-center mt-[12px] flex-wrap gap-[10px]">
          <span className="text-[12px] text-[#7A6B95]">custo: <b style={{ color: '#FF8A3D' }}>5 créditos</b></span>
          <button
            onClick={gerar}
            disabled={loading}
            className="px-[22px] py-[11px] rounded-[12px] text-[14px] font-[700] text-white"
            style={{ background: 'linear-gradient(135deg,#FFC400,#FF6B00 45%,#E11D2E)', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Gerando…' : '✨ Gerar'}
          </button>
        </div>
      </div>

      {/* Saída */}
      {out && (
        <div className="rounded-[16px] p-[18px] bg-[#12081C] border border-[rgba(59,214,113,.3)]">
          <div className="flex justify-between items-center mb-[10px]">
            <div className="text-[13px] font-[700]" style={{ color: '#5fe08d' }}>✅ Resultado</div>
            <button onClick={copyOut} className="text-[12px] font-[700] px-[14px] py-[7px] rounded-[9px] text-white" style={{ background: 'linear-gradient(135deg,#FF6B00,#E11D2E)' }}>
              📋 Copiar
            </button>
          </div>
          <div className="text-[13px] text-[#E7DDF5] whitespace-pre-wrap leading-[1.6]">{out}</div>
        </div>
      )}
    </div>
  );
};
