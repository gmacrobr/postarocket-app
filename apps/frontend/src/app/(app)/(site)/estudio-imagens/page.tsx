export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { ImageStudioComponent } from '@gitroom/frontend/components/studio/image.studio.component';
export const metadata: Metadata = { title: 'PostaRocket Estúdio de Imagens', description: '' };
export default async function Index() { return <ImageStudioComponent />; }
