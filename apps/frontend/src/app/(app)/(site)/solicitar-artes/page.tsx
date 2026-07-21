export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { LibraryRequestComponent } from '@gitroom/frontend/components/library/library.request.component';
export const metadata: Metadata = { title: 'PostaRocket Solicitar Artes', description: '' };
export default async function Index() { return <LibraryRequestComponent />; }
