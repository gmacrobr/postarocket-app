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
const btnFire = { background: 'linear-gradient(135deg,#FFC400,#FF6B00 45%,#E11D2E)' } as const;
const inp =
  'w-full bg-[#12081C] border border-[rgba(255,255,255,.12)] rounded-[9px] px-[11px] py-[8px] text-[13px] text-white';

interface Niche { id: string; name: string; icon?: string }
interface Segment { id: string; name: string; nicheId: string; categories?: Category[] }
interface Category { id: string; name: string; segmentId: string }
interface Pack { id: string; code: string; name: string; images: number; videos: number; total: number }
interface Media {
  id: string; title: string; fileName?: string; type: string; url: string;
  orientation?: string; approval?: string; packId?: string; width?: number; height?: number;
}

const ORI: Record<string, [string, string]> = {
  vertical: ['rgba(255,107,0,.15)', '#FF8A3D'],
  horizontal: ['rgba(124,58,237,.15)', '#c4a4ff'],
  quadrado: ['rgba(255,196,0,.13)', '#ffc400'],
};
const APR: Record<string, [string, string, string]> = {
  aprovado: ['rgba(59,214,113,.18)', '#3BD671', '✅ aprovado'],
  editado: ['rgba(255,196,0,.15)', '#ffc400', '✏️ editado'],
  novo: ['rgba(255,255,255,.06)', '#7A6B95', '• novo'],
};

export const LibraryB2Component: FC = () => {
  const fetch = useFetch();
  const toast = useToaster();
  const user = useUser();
  const isAdmin = !!(user as any)?.isSuperAdmin;

  const [tab, setTab] = useState<'files' | 'packs'>('files');
  const [nicheId, setNicheId] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [orientation, setOrientation] = useState('');
  const [approval, setApproval] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);

  const nichesReq = useSWR('/library/niches', async (u) => (await fetch(u)).json());
  const niches: Niche[] = nichesReq.data || [];

  const segReq = useSWR(`/library/segments${nicheId ? `?nicheId=${nicheId}` : ''}`, async (u) => (await fetch(u)).json());
  const segments: Segment[] = segReq.data || [];

  const catReq = useSWR(segmentId ? `/library/categories?segmentId=${segmentId}` : null, async (u) => (await fetch(u)).json());
  const categories: Category[] = catReq.data || [];

  const filesKey = useMemo(() => {
    const p = new URLSearchParams();
    if (nicheId) p.set('nicheId', nicheId);
    if (segmentId) p.set('segmentId', segmentId);
    if (categoryId) p.set('categoryId', categoryId);
    if (orientation) p.set('orientation', orientation);
    if (approval) p.set('approval', approval);
    if (q) p.set('q', q);
    return `/library/files?${p.toString()}`;
  }, [nicheId, segmentId, categoryId, orientation, approval, q]);

  const filesReq = useSWR(filesKey, async (u) => (await fetch(u)).json());
  const files: Media[] = filesReq.data || [];

  const packsReq = useSWR(`/library/packs${nicheId ? `?nicheId=${nicheId}` : ''}`, async (u) => (await fetch(u)).json());
  const packs: Pack[] = packsReq.data || [];

  const refresh = () => { filesReq.mutate(); packsReq.mutate(); };

  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allSel = files.length > 0 && sel.length === files.length;

  const bulk = useCallback(async (action: string, payload: any = {}) => {
    if (!sel.length) return;
    const r = await fetch('/library/files/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ action, ids: sel, payload }),
    });
    if (r.ok) {
      const d = await r.json();
      toast.show(`${d.affected} item(ns) atualizados`, 'success');
      setSel([]); refresh();
    } else toast.show('Erro na ação em massa', 'warning');
  }, [sel, fetch, toast]);

  return (
    <div className="flex flex-1 flex-col p-[8px] gap-[16px]">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between flex-wrap gap-[12px]">
        <div>
          <div className="text-[26px] font-[900] italic leading-[1.1]">
            Biblioteca <span style={fire}>Rocket</span>
          </div>
          <div className="text-[13px] text-textItemBlur mt-[2px]">
            Encontre a peça do seu segmento — use, edite e publique. 🚀
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setAdminOpen((v) => !v)}
            className="px-[16px] py-[10px] rounded-[12px] font-[700] text-[13px] text-white" style={btnFire}>
            {adminOpen ? 'Fechar admin' : '⚙️ Gerenciar'}
          </button>
        )}
      </div>

      {isAdmin && adminOpen && (
        <AdminPanel niches={niches} segments={segments} categories={categories} packs={packs}
          onChange={() => { nichesReq.mutate(); segReq.mutate(); catReq.mutate(); refresh(); }} />
      )}

      {/* Abas */}
      <div className="flex gap-[8px]">
        {([['files', '🖼️ Imagens & Vídeos'], ['packs', '📦 Packs']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)}
            className="px-[16px] py-[9px] rounded-[11px] text-[13px] font-[600]"
            style={tab === k
              ? { background: 'rgba(255,107,0,.15)', color: '#FF8A3D', border: '1px solid rgba(255,107,0,.5)' }
              : { color: '#B8A9CF', border: '1px solid rgba(255,255,255,.1)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Filtros em cascata */}
      <div className="flex gap-[8px] flex-wrap items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Buscar…"
          className={inp} style={{ width: 180 }} />
        <select className={inp} style={{ width: 160 }} value={nicheId}
          onChange={(e) => { setNicheId(e.target.value); setSegmentId(''); setCategoryId(''); }}>
          <option value="">Nicho: todos</option>
          {niches.map((n) => <option key={n.id} value={n.id}>{n.icon ? n.icon + ' ' : ''}{n.name}</option>)}
        </select>
        <select className={inp} style={{ width: 160 }} value={segmentId}
          onChange={(e) => { setSegmentId(e.target.value); setCategoryId(''); }} disabled={!nicheId}>
          <option value="">Segmento: todos</option>
          {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={inp} style={{ width: 170 }} value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)} disabled={!segmentId}>
          <option value="">Categoria: todas</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={inp} style={{ width: 150 }} value={orientation} onChange={(e) => setOrientation(e.target.value)}>
          <option value="">Orientação</option>
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
          <option value="quadrado">Quadrado</option>
        </select>
        <select className={inp} style={{ width: 140 }} value={approval} onChange={(e) => setApproval(e.target.value)}>
          <option value="">Status</option>
          <option value="novo">Novo</option>
          <option value="editado">Editado</option>
          <option value="aprovado">Aprovado</option>
        </select>
      </div>

      {/* Barra de seleção */}
      {tab === 'files' && files.length > 0 && (
        <div className="flex items-center gap-[10px] flex-wrap">
          <label className="flex items-center gap-[7px] text-[12px] text-[#B8A9CF] cursor-pointer">
            <input type="checkbox" checked={allSel}
              onChange={(e) => setSel(e.target.checked ? files.map((f) => f.id) : [])}
              style={{ accentColor: '#FF6B00', width: 15, height: 15 }} />
            Selecionar todos
          </label>
          {sel.length > 0 && (
            <>
              <span className="text-[12px] font-[700]" style={{ color: '#FF8A3D' }}>{sel.length} selecionado(s)</span>
              {isAdmin && (
                <>
                  <button onClick={() => bulk('approve')} className="text-[12px] px-[12px] py-[6px] rounded-[9px] border border-[rgba(255,255,255,.12)] text-[#B8A9CF]">✅ Aprovar</button>
                  <button onClick={() => bulk('deactivate')} className="text-[12px] px-[12px] py-[6px] rounded-[9px] border border-[rgba(255,255,255,.12)] text-[#B8A9CF]">🚫 Desativar</button>
                  <button onClick={() => { if (confirm(`Excluir ${sel.length} item(ns)?`)) bulk('delete'); }}
                    className="text-[12px] px-[12px] py-[6px] rounded-[9px]" style={{ border: '1px solid rgba(225,29,46,.5)', color: '#ff6b7a' }}>🗑️ Excluir</button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Conteúdo */}
      {tab === 'packs' ? (
        packs.length === 0 ? (
          <Empty icon="📦" title="Nenhum pack ainda"
            sub={isAdmin ? 'Crie packs no painel admin acima.' : 'Em breve packs do seu segmento. 🚀'} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[14px]">
            {packs.map((p) => (
              <div key={p.id} className="rounded-[15px] overflow-hidden bg-[#1A0D2B] border border-[rgba(255,107,0,.25)]">
                <div className="h-[92px] flex items-center justify-center text-[34px] relative"
                  style={{ background: 'linear-gradient(135deg,#2A1440,#1A0D2B)' }}>
                  📦
                  <span className="absolute top-[9px] left-[9px] text-[10px] font-[700] px-[8px] py-[2px] rounded-full"
                    style={{ background: 'rgba(225,29,46,.15)', color: '#ff8a95', border: '1px solid rgba(225,29,46,.4)', fontFamily: 'monospace' }}>
                    {p.code}
                  </span>
                </div>
                <div className="p-[13px]">
                  <div className="text-[15px] font-[700]">{p.name}</div>
                  <div className="text-[11px] text-[#7A6B95] mt-[2px] mb-[9px]">
                    {p.images} imagens + {p.videos} vídeos
                  </div>
                  <button onClick={() => { setTab('files'); toast.show(`Filtrando pelo pack ${p.code}`, 'success'); }}
                    className="w-full py-[8px] rounded-[9px] text-[12px] font-[700] text-white" style={btnFire}>
                    👁️ Ver as peças
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : files.length === 0 ? (
        <Empty icon="📚" title="Nada por aqui ainda"
          sub={isAdmin ? 'Use "Gerenciar" para cadastrar a hierarquia e enviar arquivos.' : 'Em breve conteúdo do seu segmento. 🚀'} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[13px]">
          {files.map((m) => {
            const o = ORI[m.orientation || ''] || ['rgba(255,255,255,.06)', '#7A6B95'];
            const a = APR[m.approval || 'novo'] || APR.novo;
            return (
              <div key={m.id} className="rounded-[13px] overflow-hidden bg-[#1A0D2B] border border-[rgba(255,255,255,.08)] relative">
                <label className="absolute top-[8px] left-[8px] z-10 cursor-pointer">
                  <input type="checkbox" checked={sel.includes(m.id)} onChange={() => toggle(m.id)}
                    style={{ accentColor: '#FF6B00', width: 16, height: 16 }} />
                </label>
                <div className="aspect-[4/5] bg-[#12081C] flex items-center justify-center overflow-hidden">
                  {m.type === 'video'
                    ? <video src={m.url} className="w-full h-full object-cover" muted />
                    : <img src={m.url} alt={m.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-[9px]">
                  <div className="text-[12px] font-[500] truncate">{m.fileName || m.title}</div>
                  <div className="text-[10px] text-[#7A6B95] mt-[1px]">
                    {m.width && m.height ? `${m.width}×${m.height}` : m.type}
                  </div>
                  <div className="flex gap-[4px] flex-wrap mt-[5px]">
                    {m.orientation && (
                      <span className="text-[9px] font-[600] px-[6px] py-[1px] rounded-full"
                        style={{ background: o[0], color: o[1] }}>{m.orientation}</span>
                    )}
                    <span className="text-[9px] font-[600] px-[6px] py-[1px] rounded-full"
                      style={{ background: a[0], color: a[1] }}>{a[2]}</span>
                  </div>
                  <a href={m.url} download target="_blank" rel="noreferrer"
                    className="mt-[7px] block text-center text-[11px] font-[700] py-[6px] rounded-[8px] text-white"
                    style={{ background: 'linear-gradient(135deg,#FF6B00,#E11D2E)' }}>
                    Baixar
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Empty: FC<{ icon: string; title: string; sub: string }> = ({ icon, title, sub }) => (
  <div className="flex flex-col items-center justify-center py-[56px] text-center">
    <div className="text-[50px] mb-[6px]">{icon}</div>
    <div className="text-[16px] font-[700]">{title}</div>
    <div className="text-[13px] text-textItemBlur mt-[4px] max-w-[420px]">{sub}</div>
  </div>
);

// ---------------- Painel Admin ----------------
const AdminPanel: FC<{
  niches: Niche[]; segments: Segment[]; categories: Category[]; packs: Pack[]; onChange: () => void;
}> = ({ niches, segments, categories, packs, onChange }) => {
  const fetch = useFetch();
  const toast = useToaster();

  const [nName, setNName] = useState('');
  const [nIcon, setNIcon] = useState('');
  const [sName, setSName] = useState('');
  const [sNiche, setSNiche] = useState('');
  const [cName, setCName] = useState('');
  const [cSeg, setCSeg] = useState('');

  const [pName, setPName] = useState('');
  const [pNiche, setPNiche] = useState('');
  const [pSeg, setPSeg] = useState('');

  const [upNiche, setUpNiche] = useState('');
  const [upSeg, setUpSeg] = useState('');
  const [upPack, setUpPack] = useState('');
  const [links, setLinks] = useState('');
  const [chips, setChips] = useState<{ name: string; url: string; categoryId: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const segsOf = (nid: string) => segments.filter((s) => !nid || s.nicheId === nid);
  const catsOf = (sid: string) => {
    const s = segments.find((x) => x.id === sid);
    return s?.categories || categories.filter((c) => c.segmentId === sid);
  };

  const post = async (url: string, body: any, ok: string) => {
    const r = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
    if (r.ok) { toast.show(ok, 'success'); onChange(); return true; }
    toast.show('Erro ao salvar', 'warning'); return false;
  };

  const slug = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // anexar arquivos -> sobe no servidor e vira chip
  const onFiles = async (fl: FileList | null) => {
    if (!fl?.length) return;
    setBusy(true);
    for (const f of Array.from(fl)) {
      try {
        const fd = new FormData();
        fd.append('file', f);
        const r = await fetch('/media/upload-server', { method: 'POST', body: fd as any } as any);
        const d = await r.json();
        const url = d?.path || d?.url;
        if (url) setChips((c) => [...c, { name: f.name, url, categoryId: '' }]);
      } catch { toast.show(`Falha ao enviar ${f.name}`, 'warning'); }
    }
    setBusy(false);
  };

  const addLinks = () => {
    const list = links.split('\n').map((s) => s.trim()).filter(Boolean);
    setChips((c) => [...c, ...list.map((u) => ({ name: u.split('/').pop() || 'arquivo', url: u, categoryId: '' }))]);
    setLinks('');
  };

  const publish = async () => {
    if (!chips.length) { toast.show('Adicione arquivos ou links', 'warning'); return; }
    const items = chips.map((c) => ({
      title: c.name, fileName: c.name, url: c.url,
      nicheId: upNiche || null, segmentId: upSeg || null,
      categoryId: c.categoryId || null, packId: upPack || null,
    }));
    const r = await fetch('/library/files/bulk-create', { method: 'POST', body: JSON.stringify({ items }) });
    if (r.ok) { toast.show(`${chips.length} arquivo(s) publicados!`, 'success'); setChips([]); onChange(); }
    else toast.show('Erro ao publicar', 'warning');
  };

  const box = 'bg-[#211037] rounded-[13px] p-[14px] flex flex-col gap-[7px]';
  const btn = 'text-[12px] font-[700] py-[8px] rounded-[9px] text-white';

  return (
    <div className="bg-[#1A0D2B] border border-[rgba(255,107,0,.25)] rounded-[15px] p-[15px] flex flex-col gap-[13px]">
      {/* Hierarquia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[11px]">
        <div className={box}>
          <div className="font-[800] text-[13px]">1️⃣ Nicho</div>
          <input className={inp} placeholder="Ex: Educacional" value={nName} onChange={(e) => setNName(e.target.value)} />
          <input className={inp} placeholder="Ícone (ex: 🎓)" value={nIcon} onChange={(e) => setNIcon(e.target.value)} />
          <button className={btn} style={btnFire}
            onClick={async () => { if (nName && await post('/library/niches', { name: nName, slug: slug(nName), icon: nIcon }, 'Nicho criado!')) { setNName(''); setNIcon(''); } }}>
            Criar nicho
          </button>
        </div>
        <div className={box}>
          <div className="font-[800] text-[13px]">2️⃣ Segmento</div>
          <select className={inp} value={sNiche} onChange={(e) => setSNiche(e.target.value)}>
            <option value="">Escolha o nicho</option>
            {niches.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <input className={inp} placeholder="Ex: Técnico" value={sName} onChange={(e) => setSName(e.target.value)} />
          <button className={btn} style={btnFire}
            onClick={async () => { if (sName && sNiche && await post('/library/segments', { name: sName, nicheId: sNiche }, 'Segmento criado!')) setSName(''); }}>
            Criar segmento
          </button>
        </div>
        <div className={box}>
          <div className="font-[800] text-[13px]">3️⃣ Categoria</div>
          <select className={inp} value={cSeg} onChange={(e) => setCSeg(e.target.value)}>
            <option value="">Escolha o segmento</option>
            {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className={inp} placeholder="Ex: Segurança do Trabalho" value={cName} onChange={(e) => setCName(e.target.value)} />
          <button className={btn} style={btnFire}
            onClick={async () => { if (cName && cSeg && await post('/library/categories', { name: cName, segmentId: cSeg }, 'Categoria criada!')) setCName(''); }}>
            Criar categoria
          </button>
        </div>
      </div>

      {/* Pack */}
      <div className={box}>
        <div className="font-[800] text-[13px]">📦 Criar pack <span className="text-[11px] font-[400] text-[#7A6B95]">(código gerado automaticamente)</span></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[8px]">
          <input className={inp} placeholder="Nome do pack" value={pName} onChange={(e) => setPName(e.target.value)} />
          <select className={inp} value={pNiche} onChange={(e) => { setPNiche(e.target.value); setPSeg(''); }}>
            <option value="">Nicho</option>
            {niches.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select className={inp} value={pSeg} onChange={(e) => setPSeg(e.target.value)}>
            <option value="">Segmento</option>
            {segsOf(pNiche).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button className={btn} style={btnFire}
          onClick={async () => { if (pName && await post('/library/packs', { name: pName, nicheId: pNiche || null, segmentId: pSeg || null }, 'Pack criado!')) setPName(''); }}>
          Criar pack
        </button>
      </div>

      {/* Upload */}
      <div className={box}>
        <div className="font-[800] text-[13px]">📤 Enviar arquivos</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[8px]">
          <select className={inp} value={upNiche} onChange={(e) => { setUpNiche(e.target.value); setUpSeg(''); }}>
            <option value="">Nicho (padrão)</option>
            {niches.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
          <select className={inp} value={upSeg} onChange={(e) => setUpSeg(e.target.value)}>
            <option value="">Segmento (padrão)</option>
            {segsOf(upNiche).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className={inp} value={upPack} onChange={(e) => setUpPack(e.target.value)}>
            <option value="">Sem pack</option>
            {packs.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
          </select>
        </div>

        <div className="flex gap-[8px] flex-wrap items-center mt-[3px]">
          <label className="text-[12px] font-[700] px-[14px] py-[8px] rounded-[9px] text-white cursor-pointer" style={btnFire}>
            📎 Anexar arquivos
            <input type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
          </label>
          {busy && <span className="text-[12px] text-[#FF8A3D]">enviando…</span>}
        </div>

        <textarea className={inp} rows={2} placeholder="Ou cole links (um por linha)" value={links} onChange={(e) => setLinks(e.target.value)} />
        <button className="text-[12px] px-[12px] py-[7px] rounded-[9px] border border-[rgba(255,255,255,.12)] text-[#B8A9CF] self-start" onClick={addLinks}>
          Adicionar links
        </button>

        {chips.length > 0 && (
          <div className="flex flex-col gap-[6px] mt-[6px]">
            {chips.map((c, i) => (
              <div key={i} className="flex items-center gap-[8px] bg-[#12081C] border border-[rgba(255,255,255,.1)] rounded-[9px] px-[10px] py-[7px]">
                <span className="text-[15px]">{/\.(mp4|webm|mov)$/i.test(c.url) ? '🎬' : '🖼️'}</span>
                <input value={c.name} onChange={(e) => setChips((cs) => cs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  className="flex-1 bg-transparent border-none text-[12px] text-white outline-none" />
                <select value={c.categoryId} onChange={(e) => setChips((cs) => cs.map((x, j) => j === i ? { ...x, categoryId: e.target.value } : x))}
                  className="bg-[#211037] border border-[rgba(255,255,255,.12)] rounded-[7px] px-[8px] py-[4px] text-[11px] text-white">
                  <option value="">Categoria…</option>
                  {catsOf(upSeg).map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                </select>
                <button onClick={() => setChips((cs) => cs.filter((_, j) => j !== i))} className="text-[#7A6B95] text-[14px]">✕</button>
              </div>
            ))}
            <button className={btn} style={btnFire} onClick={publish}>
              ✓ Publicar {chips.length} arquivo(s)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
