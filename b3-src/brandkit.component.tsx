'use client';

import React, { FC, useCallback, useEffect, useState } from 'react';
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
  'w-full bg-[#12081C] border border-[rgba(255,255,255,.12)] rounded-[9px] px-[11px] py-[9px] text-[13px] text-white';
const box = 'bg-[#1A0D2B] border border-[rgba(255,255,255,.08)] rounded-[15px] p-[16px] flex flex-col gap-[11px]';

const LOGOS: { key: string; label: string; hint: string; dark?: boolean }[] = [
  { key: 'logoLight', label: 'Logo — fundo claro', hint: 'PNG 1000×1000' },
  { key: 'logoDark', label: 'Logo — fundo escuro', hint: 'PNG 1000×1000', dark: true },
  { key: 'logoWide', label: 'Logo retangular', hint: 'PNG 1600×400' },
  { key: 'watermark', label: "Marca d'água", hint: 'PNG transparente 500×500', dark: true },
];

const DADOS: { key: string; label: string; ph: string }[] = [
  { key: 'tradeName', label: 'Nome fantasia', ph: 'Barbearia do Zé' },
  { key: 'legalName', label: 'Razão social', ph: 'Zé Barbearia LTDA' },
  { key: 'document', label: 'CNPJ / CPF', ph: '00.000.000/0001-00' },
  { key: 'email', label: 'E-mail', ph: 'contato@empresa.com.br' },
  { key: 'whatsapp', label: 'WhatsApp', ph: '(15) 99999-9999' },
  { key: 'phone', label: 'Telefone fixo', ph: '(15) 3333-3333' },
  { key: 'website', label: 'Site', ph: 'www.empresa.com.br' },
  { key: 'address', label: 'Endereço', ph: 'Rua Exemplo, 123 — Sorocaba/SP' },
];

const REDES: { key: string; label: string; icon: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: '📷' },
  { key: 'facebook', label: 'Facebook', icon: '👍' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
  { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { key: 'x', label: 'X / Twitter', icon: '✖️' },
];

const CORES: { key: string; label: string }[] = [
  { key: 'colorPrimary', label: 'Cor principal' },
  { key: 'colorSecondary', label: 'Cor secundária' },
  { key: 'colorAccent', label: 'Cor de destaque' },
];

export const BrandKitComponent: FC = () => {
  const fetch = useFetch();
  const toast = useToaster();

  const kitReq = useSWR('/brand/kit', async (u) => (await fetch(u)).json());
  const statusReq = useSWR('/brand/kit/status', async (u) => (await fetch(u)).json());

  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');

  useEffect(() => {
    if (kitReq.data) setForm(kitReq.data);
  }, [kitReq.data]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const upload = useCallback(async (key: string, file?: File) => {
    if (!file) return;
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/media/upload-server', { method: 'POST', body: fd as any } as any);
      const d = await r.json();
      const url = d?.path || d?.url;
      if (url) { set(key, url); toast.show('Imagem enviada! Não esqueça de salvar. 💾', 'success'); }
      else toast.show('Falha no envio', 'warning');
    } catch { toast.show('Erro no upload', 'warning'); }
    finally { setUploading(''); }
  }, [fetch, toast]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const r = await fetch('/brand/kit', { method: 'POST', body: JSON.stringify(form) });
      if (r.ok) {
        toast.show('Kit de marca salvo! 🎨', 'success');
        kitReq.mutate(); statusReq.mutate();
      } else toast.show('Erro ao salvar', 'warning');
    } finally { setSaving(false); }
  }, [form, fetch, toast, kitReq, statusReq]);

  const pct = statusReq.data?.percent ?? 0;

  return (
    <div className="flex flex-1 flex-col p-[8px] gap-[16px]">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between flex-wrap gap-[12px]">
        <div>
          <div className="text-[26px] font-[900] italic leading-[1.1]">
            Minha <span style={fire}>Marca</span>
          </div>
          <div className="text-[13px] text-textItemBlur mt-[2px]">
            Cadastre uma vez — suas artes saem personalizadas automaticamente. 🎨
          </div>
        </div>
        <button onClick={save} disabled={saving}
          className="px-[22px] py-[11px] rounded-[12px] font-[700] text-[14px] text-white"
          style={{ ...btnFire, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Salvando…' : '💾 Salvar kit'}
        </button>
      </div>

      {/* Progresso */}
      <div className="rounded-[14px] p-[15px]"
        style={{ background: 'linear-gradient(135deg,rgba(255,107,0,.12),rgba(225,29,46,.08))', border: '1px solid rgba(255,107,0,.3)' }}>
        <div className="flex justify-between items-center text-[12px] mb-[7px]">
          <span className="text-[#D6C9EC]">Kit {pct}% completo</span>
          <span className="text-[#7A6B95]">
            {pct === 100 ? 'Tudo pronto para gerar com sua marca! 🚀' : 'Complete para melhores resultados'}
          </span>
        </div>
        <div className="h-[7px] rounded-full bg-[#12081C] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, ...btnFire }} />
        </div>
      </div>

      {/* Logos */}
      <div className={box}>
        <div className="font-[800] text-[14px]">🖼️ Logos</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[11px]">
          {LOGOS.map((l) => (
            <div key={l.key} className="flex flex-col gap-[7px]">
              <div className="text-[12px] text-[#B8A9CF]">{l.label}</div>
              <label className="rounded-[11px] cursor-pointer flex items-center justify-center overflow-hidden relative"
                style={{
                  height: 110,
                  background: l.dark ? '#0D0517' : '#F4F1F8',
                  border: '1px dashed rgba(255,255,255,.2)',
                }}>
                {form[l.key]
                  ? <img src={form[l.key]} alt={l.label} className="max-w-full max-h-full object-contain" />
                  : <span className="text-[11px]" style={{ color: l.dark ? '#7A6B95' : '#9a8fb0' }}>
                      {uploading === l.key ? 'enviando…' : '+ enviar'}
                    </span>}
                <input type="file" accept="image/*" hidden onChange={(e) => upload(l.key, e.target.files?.[0])} />
              </label>
              <div className="text-[10px] text-[#7A6B95]">{l.hint}</div>
              {form[l.key] && (
                <button onClick={() => set(l.key, '')} className="text-[10px] text-[#ff8a95] self-start">remover</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cores */}
      <div className={box}>
        <div className="font-[800] text-[14px]">🎨 Cores da marca</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[11px]">
          {CORES.map((c) => (
            <div key={c.key} className="flex items-center gap-[10px]">
              <input type="color" value={form[c.key] || '#FF6B00'} onChange={(e) => set(c.key, e.target.value)}
                style={{ width: 46, height: 40, borderRadius: 9, border: '1px solid rgba(255,255,255,.15)', background: 'transparent', cursor: 'pointer' }} />
              <div className="flex-1">
                <div className="text-[12px] text-[#B8A9CF] mb-[3px]">{c.label}</div>
                <input className={inp} value={form[c.key] || ''} onChange={(e) => set(c.key, e.target.value)} placeholder="#FF6B00" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dados */}
      <div className={box}>
        <div className="font-[800] text-[14px]">🏢 Dados da empresa</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[11px]">
          {DADOS.map((d) => (
            <div key={d.key}>
              <div className="text-[12px] text-[#B8A9CF] mb-[4px]">{d.label}</div>
              <input className={inp} value={form[d.key] || ''} placeholder={d.ph}
                onChange={(e) => set(d.key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Redes */}
      <div className={box}>
        <div className="font-[800] text-[14px]">🌐 Redes sociais</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[11px]">
          {REDES.map((r) => (
            <div key={r.key}>
              <div className="text-[12px] text-[#B8A9CF] mb-[4px]">{r.icon} {r.label}</div>
              <input className={inp} value={form[r.key] || ''} placeholder="@seuperfil"
                onChange={(e) => set(r.key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="px-[22px] py-[13px] rounded-[12px] font-[700] text-[14px] text-white self-start"
        style={{ ...btnFire, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Salvando…' : '💾 Salvar kit de marca'}
      </button>
    </div>
  );
};
