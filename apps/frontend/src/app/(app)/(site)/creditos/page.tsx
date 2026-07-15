export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { CreditsComponent } from '@gitroom/frontend/components/credits/credits.component';
export const metadata: Metadata = { title: 'PostaRocket Créditos', description: '' };
export default async function Index() { return <CreditsComponent />; }
