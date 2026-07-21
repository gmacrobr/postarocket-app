export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { BrandKitComponent } from '@gitroom/frontend/components/brandkit/brandkit.component';
export const metadata: Metadata = { title: 'PostaRocket Minha Marca', description: '' };
export default async function Index() { return <BrandKitComponent />; }
