export const dynamic = 'force-dynamic';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PostaRocket Suporte',
  description: '',
};

const fire = {
  backgroundImage:
    'linear-gradient(135deg,#FFC400 0%,#FF6B00 45%,#E11D2E 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
} as const;

export default async function Index() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[70vh] text-center px-[24px]">
      <div className="text-[64px] mb-[8px]">🛟</div>
      <div className="text-[38px] font-[900] italic leading-[1.1]">
        Central de <span style={fire}>Suporte</span>
      </div>
      <span
        className="mt-[16px] text-[12px] font-[700] tracking-[0.2em] uppercase px-[16px] py-[6px] rounded-full border"
        style={{ color: '#FF8A3D', borderColor: 'rgba(255,107,0,.45)' }}
      >
        🚀 Em breve
      </span>
      <div className="mt-[22px] max-w-[560px] text-[15px]" style={{ color: '#B8A9CF' }}>
        Nossa central de ajuda está em construção. Em breve você abrirá
        chamados, acompanhará solicitações e encontrará tutoriais completos —
        tudo por aqui.
      </div>
    </div>
  );
}
