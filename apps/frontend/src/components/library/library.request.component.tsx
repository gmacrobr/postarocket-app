'use client';

import React, { FC, useCallback, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useUser } from '@gitroom/frontend/components/layout/user.context';

const fire: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg,#FFC400 0%,#FF6B00 45%,#E11D2E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};
const btnFire = { background: 'linear-gradient(135deg,#FFC400,#FF6B00 45%,#E11D2E)' } as const;
const inp =
  'w-full bg-[#12081C] border border-[rgba(255,255,255,.12)] rounded-[9px] px-[11px] py-[9px] text-[13px] text-white';

const STATUS: Record<string, [string, string, string]> = {
  aberta: ['rgba(255,196,0,.15)', '#ffc400', '🕐 Aberta'],
  producao: ['rgba(124,58,237,.18)', '#c4a4ff', '🎨 Em produção'],
  atendida: ['rgba(59,214,113,.18)', '#3BD671', '✅ Atendida'],
  recusada: ['rgba(225,29,46,.15)', '#ff8a95', '✖️ Recusada'],
};

interface Req {
  id: string; title: string; description: string; format?: string;
  reference?: string; deadline?: string; status: string;
  adminNote?: string; deliveredUrl?: string; createdAt: string; organizationId: string;
}

export const LibraryRequestComponent: FC = () => {
  const fetch = useFetch();
  const toast = useToaster();
  const user = useUser();
  const isAdmin = !!(user as any)?.isSuperAdmin;

  const [view, setView] = useState<'mine' | 'all'>('mine');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [format, setFormat] = useState('feed');
  const [ref, setRef] = useState('');
  const [deadline, setDeadline] = useState('');
  const [sending, setSending] = useState(false);

  const mineReq = useSWR('/library-requests/mine', async (u) => (await fetch(u)).json());
  const allReq = useSWR(isAdmin && view === 'all' ? '/library-requests/all' : null, async (u) => (await fetch(u)).json());

  const list: Req[] = (view === 'all' ? allReq.data : mineReq.data) || [];

  const enviar = useCallback(async () => {
    if (!title.trim() || !desc.trim()) {
      toast.show('Preencha o título e a descrição', 'warning');
      return;
    }
    setSending(true);
    try {
      const r = await fetch('/library-requests/', {
        method: 'POST',
        body: JSON.stringify({ title, description: desc, format, reference: ref, deadline }),
      });
      if (r.ok) {
        toast.show('Pedido enviado! Vamos te avisar quando estiver pronto. 🚀', 'success');
        setTitle(''); setDesc(''); setRef(''); setDeadline('');
        mineReq.mutate();
      } else toast.show('Erro ao enviar', 'warning');
    } finally { setSending(false); }
  }, [title, desc, format, ref, deadline, fetch, toast, mineReq]);

  const setStatus = useCallback(async (id: string, status: string) => {
    const r = await fetch(`/library-requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
    if (r.ok) { toast.show('Status atualizado', 'success'); mineReq.mutate(); allReq.mutate(); }
  }, [fetch, toast, mineReq, allReq]);

  const cancelar = useCallback(async (id: string) => {
    if (!confirm('Cancelar este pedido?')) return;
    const r = await fetch(`/library-requests/mine/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.show('Pedido cancelado', 'success'); mineReq.mutate(); }
    else toast.show('Não foi possível cancelar', 'warning');
  }, [fetch, toast, mineReq]);

  return (
    <div className="flex flex-1 flex-col p-[8px] gap-[16px]">
      <div>
        <div className="text-[26px] font-[900] italic leading-[1.1]">
          Solicitar <span style={fire}>Artes</span>
        </div>
        <div className="text-[13px] text-textItemBlur mt-[2px]">
          Não achou o que precisa? Peça uma peça sob medida. 📮
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-[#1A0D2B] border border-[rgba(255,107,0,.25)] rounded-[15px] p-[16px] flex flex-col gap-[11px]">
        <div className="font-[800] text-[14px]">✏️ Novo pedido</div>
        <input className={inp} placeholder="Título — ex: Post de Black Friday" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={inp} rows={4}
          placeholder="Descreva com detalhes: o que precisa aparecer, cores, clima, público-alvo, textos obrigatórios…"
          value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[9px]">
          <select className={inp} value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="feed">Feed (1080×1350)</option>
            <option value="vertical">Story/Reels (1080×1920)</option>
            <option value="ambos">Os dois formatos</option>
          </select>
          <input className={inp} placeholder="Link de referência (opcional)" value={ref} onChange={(e) => setRef(e.target.value)} />
          <input className={inp} placeholder="Prazo desejado (opcional)" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <button onClick={enviar} disabled={sending}
          className="self-start px-[22px] py-[11px] rounded-[12px] font-[700] text-[13px] text-white"
          style={{ ...btnFire, opacity: sending ? 0.6 : 1 }}>
          {sending ? 'Enviando…' : '📮 Enviar pedido'}
        </button>
      </div>

      {/* Abas admin */}
      {isAdmin && (
        <div className="flex gap-[8px]">
          {([['mine', '👤 Meus pedidos'], ['all', '🛠️ Todos (admin)']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setView(k as any)}
              className="px-[15px] py-[8px] rounded-[11px] text-[13px] font-[600]"
              style={view === k
                ? { background: 'rgba(255,107,0,.15)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
                : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.1)' }}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-[46px] text-center">
          <div className="text-[46px] mb-[6px]">📮</div>
          <div className="text-[15px] font-[700]">Nenhum pedido ainda</div>
          <div className="text-[13px] text-textItemBlur mt-[3px]">Use o formulário acima para pedir sua primeira arte.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {list.map((r) => {
            const s = STATUS[r.status] || STATUS.aberta;
            return (
              <div key={r.id} className="bg-[#1A0D2B] border border-[rgba(255,255,255,.08)] rounded-[13px] p-[14px]">
                <div className="flex justify-between items-start gap-[10px] flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-[8px] flex-wrap">
                      <span className="font-[700] text-[14px]">{r.title}</span>
                      <span className="text-[10px] font-[700] px-[8px] py-[2px] rounded-full"
                        style={{ background: s[0], color: s[1] }}>{s[2]}</span>
                      {r.format && <span className="text-[10px] text-[#7A6B95]">{r.format}</span>}
                    </div>
                    <div className="text-[12px] text-[#B8A9CF] mt-[5px] whitespace-pre-wrap">{r.description}</div>
                    {r.deadline && <div className="text-[11px] text-[#7A6B95] mt-[4px]">⏱️ prazo: {r.deadline}</div>}
                    {r.reference && (
                      <a href={r.reference} target="_blank" rel="noreferrer" className="text-[11px] mt-[3px] inline-block" style={{ color: '#FF8A3D' }}>
                        🔗 referência
                      </a>
                    )}
                    {r.adminNote && (
                      <div className="mt-[7px] text-[12px] p-[9px] rounded-[9px]"
                        style={{ background: 'rgba(255,255,255,.04)', color: '#D6C9EC' }}>
                        💬 {r.adminNote}
                      </div>
                    )}
                    {r.deliveredUrl && (
                      <a href={r.deliveredUrl} target="_blank" rel="noreferrer"
                        className="mt-[8px] inline-block text-[12px] font-[700] px-[14px] py-[7px] rounded-[9px] text-white" style={btnFire}>
                        ⬇️ Baixar arte entregue
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col gap-[5px] items-end">
                    <span className="text-[10px] text-[#7A6B95]">
                      {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                    {isAdmin && view === 'all' ? (
                      <div className="flex gap-[4px] flex-wrap justify-end">
                        {Object.keys(STATUS).map((st) => (
                          <button key={st} onClick={() => setStatus(r.id, st)}
                            className="text-[10px] px-[8px] py-[4px] rounded-[7px]"
                            style={r.status === st
                              ? { background: STATUS[st][0], color: STATUS[st][1], border: `1px solid ${STATUS[st][1]}55` }
                              : { color: '#7A6B95', border: '1px solid rgba(255,255,255,.1)' }}>
                            {STATUS[st][2]}
                          </button>
                        ))}
                      </div>
                    ) : r.status === 'aberta' ? (
                      <button onClick={() => cancelar(r.id)} className="text-[11px] text-[#ff8a95]">cancelar</button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
