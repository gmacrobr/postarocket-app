export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { FlyerStudioComponent } from '@gitroom/frontend/components/studio/flyer.studio.component';
export const metadata: Metadata = { title: 'PostaRocket Estúdio de Flyers', description: '' };
export default async function Index() { return <FlyerStudioComponent />; }
