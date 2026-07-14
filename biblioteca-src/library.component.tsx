'use client';

import React, { FC, useCallback, useMemo, useState } from 'react';
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

interface Niche { id: string; name: string; slug: string; icon?: string; active?: boolean }
interface Media { id: string; title: string; type: string; url: string; thumbnail?: string; category?: string; niche?: Niche }
interface Ad { id: string; title: string; postTitle?: string; copy: string; mediaType: string; mediaUrl?: string; thumbnail?: string; niche?: Niche }

export const LibraryComponent: FC = () => {
  const fetch = useFetch();
  const toast = useToaster();
  const user = useUser();
  const isAdmin = !!(user as any)?.isSuperAdmin;

  const [tab, setTab] = useState<'medias' | 'ads'>('medias');
  const [nicheId, setNicheId] = useState<string>('');
  const [adminOpen, setAdminOpen] = useState(false);

  const nichesReq = useSWR('/library/niches', async (u) => (await fetch(u)).json());
  const niches: Niche[] = nichesReq.data || [];

  const listKey = `/library/${tab}${nicheId ? `?nicheId=${nicheId}` : ''}`;
  const listReq = useSWR(listKey, async (u) => (await fetch(u)).json());
  const items = listReq.data || [];

  const copyCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.show('Copy copiada! Cole no seu post ✨', 'success');
  }, [toast]);

  return (
    <div className="flex flex-1 flex-col p-[8px] gap-[20px]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-[12px]">
        <div>
          <div className="text-[26px] font-[900] italic leading-[1.1]">
            Biblioteca <span style={fire}>Rocket</span>
          </div>
          <div className="text-[13px] text-textItemBlur mt-[2px]">
            Mídias e anúncios prontos por segmento — é só escolher, editar e publicar. 🚀
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAdminOpen((v) => !v)}
            className="px-[16px] py-[10px] rounded-[12px] font-[700] text-[13px] text-white"
            style={{ background: 'linear-gradient(135deg,#FFC400,#FF6B00 45%,#E11D2E)' }}
          >
            {adminOpen ? 'Fechar admin' : '⚙️ Gerenciar (admin)'}
          </button>
        )}
      </div>

      {isAdmin && adminOpen && <AdminPanel niches={niches} onChange={() => { nichesReq.mutate(); listReq.mutate(); }} />}

      {/* Abas */}
      <div className="flex gap-[8px]">
        {(['medias', 'ads'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className="px-[18px] py-[10px] rounded-[12px] font-[600] text-[14px] transition-colors"
            style={tab === tb
              ? { background: 'rgba(255,107,0,.15)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
              : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.08)' }}
          >
            {tb === 'medias' ? '🖼️ Imagens & Vídeos' : '📢 Anúncios prontos'}
          </button>
        ))}
      </div>

      {/* Filtro por nicho */}
      <div className="flex gap-[8px] flex-wrap items-center">
        <button
          onClick={() => setNicheId('')}
          className="px-[14px] py-[7px] rounded-full text-[13px] font-[600]"
          style={!nicheId
            ? { background: 'rgba(255,107,0,.15)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
            : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.1)' }}
        >
          Todos
        </button>
        {niches.map((n) => (
          <button
            key={n.id}
            onClick={() => setNicheId(n.id)}
            className="px-[14px] py-[7px] rounded-full text-[13px] font-[600]"
            style={nicheId === n.id
              ? { background: 'rgba(255,107,0,.15)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
              : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.1)' }}
          >
            {n.icon ? `${n.icon} ` : ''}{n.name}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {listReq.isLoading ? (
        <div className="text-textItemBlur text-[14px] py-[40px] text-center">Carregando…</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-[60px] text-center">
          <div className="text-[52px] mb-[6px]">📚</div>
          <div className="text-[16px] font-[700]">Nada por aqui ainda</div>
          <div className="text-[13px] text-textItemBlur mt-[4px] max-w-[420px]">
            {isAdmin
              ? 'Use o botão "Gerenciar (admin)" acima para cadastrar nichos, mídias e anúncios.'
              : 'Em breve nosso time vai abastecer esta seção com conteúdo do seu segmento. 🚀'}
          </div>
        </div>
      ) : tab === 'medias' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[14px]">
          {(items as Media[]).map((m) => (
            <div key={m.id} className="rounded-[14px] overflow-hidden border border-[rgba(255,255,255,.08)] bg-[#1A0D2B] group">
              <div className="aspect-square bg-[#12081C] flex items-center justify-center overflow-hidden">
                {m.type === 'video'
                  ? <video src={m.url} className="w-full h-full object-cover" muted />
                  : <img src={m.thumbnail || m.url} alt={m.title} className="w-full h-full object-cover" />}
              </div>
              <div className="p-[10px]">
                <div className="text-[13px] font-[600] truncate">{m.title}</div>
                {m.category && <div className="text-[11px] text-textItemBlur">{m.category}</div>}
                <a href={m.url} download target="_blank" rel="noreferrer"
                  className="mt-[8px] block text-center text-[12px] font-[700] py-[7px] rounded-[8px] text-white"
                  style={{ background: 'linear-gradient(135deg,#FF6B00,#E11D2E)' }}>
                  Baixar
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
          {(items as Ad[]).map((a) => (
            <div key={a.id} className="rounded-[16px] overflow-hidden border border-[rgba(255,107,0,.2)] bg-[#1A0D2B] flex flex-col">
              {a.mediaUrl && (
                <div className="aspect-video bg-[#12081C] overflow-hidden">
                  {a.mediaType === 'video'
                    ? <video src={a.mediaUrl} className="w-full h-full object-cover" muted />
                    : <img src={a.thumbnail || a.mediaUrl} alt={a.title} className="w-full h-full object-cover" />}
                </div>
              )}
              <div className="p-[16px] flex flex-col gap-[8px] flex-1">
                {a.postTitle && <div className="text-[15px] font-[800]">{a.postTitle}</div>}
                <div className="text-[13px] text-[#D6C9EC] whitespace-pre-wrap flex-1">{a.copy}</div>
                <button onClick={() => copyCopy(`${a.postTitle ? a.postTitle + '\n\n' : ''}${a.copy}`)}
                  className="mt-[6px] text-[13px] font-[700] py-[9px] rounded-[10px] text-white"
                  style={{ background: 'linear-gradient(135deg,#FFC400,#FF6B00 45%,#E11D2E)' }}>
                  📋 Copiar copy pronta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------- Painel admin (superadmin) ----------------
const AdminPanel: FC<{ niches: Niche[]; onChange: () => void }> = ({ niches, onChange }) => {
  const fetch = useFetch();
  const toast = useToaster();
  const [nName, setNName] = useState('');
  const [nIcon, setNIcon] = useState('');

  const [mTitle, setMTitle] = useState('');
  const [mUrl, setMUrl] = useState('');
  const [mNiche, setMNiche] = useState('');
  const [mCat, setMCat] = useState('');

  const [aTitle, setATitle] = useState('');
  const [aPostTitle, setAPostTitle] = useState('');
  const [aCopy, setACopy] = useState('');
  const [aUrl, setAUrl] = useState('');
  const [aNiche, setANiche] = useState('');

  const post = async (url: string, body: any, ok: string) => {
    const r = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
    if (r.ok) { toast.show(ok, 'success'); onChange(); }
    else toast.show('Erro ao salvar', 'warning');
  };

  const slugify = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const inp = 'w-full bg-[#12081C] border border-[rgba(255,255,255,.12)] rounded-[10px] px-[12px] py-[9px] text-[13px] text-white';
  const box = 'flex-1 min-w-[280px] bg-[#211037] rounded-[14px] p-[16px] flex flex-col gap-[8px]';
  const btn = 'text-[13px] font-[700] py-[9px] rounded-[10px] text-white';
  const btnStyle = { background: 'linear-gradient(135deg,#FF6B00,#E11D2E)' } as React.CSSProperties;

  return (
    <div className="flex gap-[16px] flex-wrap bg-[#1A0D2B] border border-[rgba(255,107,0,.25)] rounded-[16px] p-[16px]">
      {/* Nicho */}
      <div className={box}>
        <div className="font-[800] text-[14px]">➕ Novo nicho</div>
        <input className={inp} placeholder="Nome (ex: Barbearia)" value={nName} onChange={(e) => setNName(e.target.value)} />
        <input className={inp} placeholder="Ícone/emoji (ex: 💈)" value={nIcon} onChange={(e) => setNIcon(e.target.value)} />
        <button className={btn} style={btnStyle}
          onClick={() => nName && post('/library/niches', { name: nName, slug: slugify(nName), icon: nIcon }, 'Nicho criado!').then(() => { setNName(''); setNIcon(''); })}>
          Criar nicho
        </button>
      </div>

      {/* Mídia */}
      <div className={box}>
        <div className="font-[800] text-[14px]">🖼️ Nova mídia</div>
        <input className={inp} placeholder="Título" value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
        <input className={inp} placeholder="URL da imagem/vídeo" value={mUrl} onChange={(e) => setMUrl(e.target.value)} />
        <input className={inp} placeholder="Categoria (opcional)" value={mCat} onChange={(e) => setMCat(e.target.value)} />
        <select className={inp} value={mNiche} onChange={(e) => setMNiche(e.target.value)}>
          <option value="">Sem nicho</option>
          {niches.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <button className={btn} style={btnStyle}
          onClick={() => mTitle && mUrl && post('/library/medias', { title: mTitle, url: mUrl, type: mUrl.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image', category: mCat, nicheId: mNiche || null }, 'Mídia adicionada!').then(() => { setMTitle(''); setMUrl(''); setMCat(''); })}>
          Adicionar mídia
        </button>
      </div>

      {/* Anúncio pronto */}
      <div className={box}>
        <div className="font-[800] text-[14px]">📢 Novo anúncio pronto</div>
        <input className={inp} placeholder="Título interno" value={aTitle} onChange={(e) => setATitle(e.target.value)} />
        <input className={inp} placeholder="Título do post (sugerido)" value={aPostTitle} onChange={(e) => setAPostTitle(e.target.value)} />
        <textarea className={inp} placeholder="Copy completa (legenda)" rows={3} value={aCopy} onChange={(e) => setACopy(e.target.value)} />
        <input className={inp} placeholder="URL da mídia (opcional)" value={aUrl} onChange={(e) => setAUrl(e.target.value)} />
        <select className={inp} value={aNiche} onChange={(e) => setANiche(e.target.value)}>
          <option value="">Sem nicho</option>
          {niches.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <button className={btn} style={btnStyle}
          onClick={() => aTitle && aCopy && post('/library/ads', { title: aTitle, postTitle: aPostTitle, copy: aCopy, mediaUrl: aUrl || null, mediaType: aUrl.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image', nicheId: aNiche || null }, 'Anúncio criado!').then(() => { setATitle(''); setAPostTitle(''); setACopy(''); setAUrl(''); })}>
          Criar anúncio
        </button>
      </div>
    </div>
  );
};
