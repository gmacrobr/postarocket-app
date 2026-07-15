'use client';

import React, { FC, useCallback } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';

const fire: React.CSSProperties = {
  backgroundImage: 'linear-gradient(135deg,#FFC400 0%,#FF6B00 45%,#E11D2E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

interface Pkg { id: string; name: string; price: number; credits: number; bonus: number }
interface Tx { id: string; amount: number; balanceAfter: number; type: string; action?: string; description?: string; createdAt: string }

const typeLabel: Record<string, string> = {
  recarga: '💳 Recarga', consumo: '⚡ Consumo', estorno: '↩️ Estorno',
  bonus: '🎁 Bônus', ajuste: '🔧 Ajuste',
};

export const CreditsComponent: FC = () => {
  const fetch = useFetch();
  const toast = useToaster();

  const walletReq = useSWR('/credits/wallet', async (u) => (await fetch(u)).json());
  const pkgReq = useSWR('/credits/packages', async (u) => (await fetch(u)).json());
  const histReq = useSWR('/credits/history', async (u) => (await fetch(u)).json());
  const priceReq = useSWR('/credits/prices', async (u) => (await fetch(u)).json());

  const balance = walletReq.data?.balance ?? 0;
  const packages: Pkg[] = pkgReq.data || [];
  const history: Tx[] = histReq.data || [];
  const prices = priceReq.data || [];

  const recarregar = useCallback((p: Pkg) => {
    // C1: placeholder — a integração Asaas entra no próximo passo
    toast.show(`Recarga de ${p.name} — checkout Asaas (em integração). Total: ${(p.credits + p.bonus).toLocaleString()} créditos.`, 'success');
  }, [toast]);

  const money = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');

  return (
    <div className="flex flex-1 flex-col p-[8px] gap-[20px]">
      <div>
        <div className="text-[26px] font-[900] italic leading-[1.1]">
          Meus <span style={fire}>Créditos</span>
        </div>
        <div className="text-[13px] text-textItemBlur mt-[2px]">
          Recarregue e use nossas ferramentas de IA. Créditos não expiram. 🚀
        </div>
      </div>

      {/* Saldo */}
      <div
        className="rounded-[18px] p-[24px] flex items-center justify-between flex-wrap gap-[16px]"
        style={{ background: 'linear-gradient(135deg,rgba(255,107,0,.15),rgba(225,29,46,.1))', border: '1px solid rgba(255,107,0,.3)' }}
      >
        <div>
          <div className="text-[13px] text-[#B8A9CF]">Saldo atual</div>
          <div className="text-[40px] font-[900] italic" style={fire}>
            {balance.toLocaleString('pt-BR')}
          </div>
          <div className="text-[12px] text-[#7A6B95]">créditos disponíveis</div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-[#7A6B95]">equivale a</div>
          <div className="text-[20px] font-[700]">R$ {money(balance)}</div>
        </div>
      </div>

      {/* Pacotes */}
      <div>
        <div className="text-[15px] font-[700] mb-[12px]">💳 Recarregar</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[12px]">
          {packages.map((p) => {
            const total = p.credits + p.bonus;
            return (
              <div key={p.id} className="rounded-[16px] p-[18px] flex flex-col items-center text-center bg-[#1A0D2B] border border-[rgba(255,107,0,.2)]">
                <div className="text-[15px] font-[700]">{p.name}</div>
                <div className="text-[28px] font-[900] italic my-[6px]" style={fire}>
                  R$ {money(p.price)}
                </div>
                <div className="text-[13px] text-[#D6C9EC]">{total.toLocaleString('pt-BR')} créditos</div>
                {p.bonus > 0 && (
                  <div className="text-[11px] text-[#3BD671] font-[600] mt-[2px]">
                    +{p.bonus.toLocaleString('pt-BR')} bônus 🎁
                  </div>
                )}
                <button
                  onClick={() => recarregar(p)}
                  className="mt-[12px] w-full py-[9px] rounded-[10px] text-[13px] font-[700] text-white"
                  style={{ background: 'linear-gradient(135deg,#FF6B00,#E11D2E)' }}
                >
                  Recarregar
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela de custos */}
      {prices.length > 0 && (
        <div>
          <div className="text-[15px] font-[700] mb-[10px]">⚡ Custo por ação</div>
          <div className="flex gap-[10px] flex-wrap">
            {prices.filter((p: any) => p.active).map((p: any) => (
              <div key={p.action} className="rounded-[10px] px-[14px] py-[8px] bg-[#211037] border border-[rgba(255,255,255,.08)] text-[13px]">
                {p.label}: <b style={{ color: '#FF8A3D' }}>{p.cost} créditos</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico */}
      <div>
        <div className="text-[15px] font-[700] mb-[10px]">📊 Histórico</div>
        {history.length === 0 ? (
          <div className="text-[13px] text-textItemBlur py-[20px] text-center">
            Nenhuma movimentação ainda.
          </div>
        ) : (
          <div className="rounded-[14px] overflow-hidden border border-[rgba(255,255,255,.08)]">
            {history.map((t) => (
              <div key={t.id} className="flex items-center gap-[12px] px-[16px] py-[11px] border-b border-[rgba(255,255,255,.06)] text-[13px]">
                <span className="w-[110px] text-[#B8A9CF]">{typeLabel[t.type] || t.type}</span>
                <span className="flex-1 text-[#D6C9EC] truncate">{t.description || t.action || '—'}</span>
                <span className="font-[700]" style={{ color: t.amount >= 0 ? '#3BD671' : '#ff8a95' }}>
                  {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString('pt-BR')}
                </span>
                <span className="w-[90px] text-right text-[#7A6B95]">{t.balanceAfter.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
