export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { StudioComponent } from '@gitroom/frontend/components/studio/studio.component';
export const metadata: Metadata = { title: 'PostaRocket Estúdio de IA', description: '' };
export default async function Index() { return <StudioComponent />; }
