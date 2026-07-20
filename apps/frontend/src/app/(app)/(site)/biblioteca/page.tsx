export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { LibraryB2Component } from '@gitroom/frontend/components/library/library.b2.component';
export const metadata: Metadata = { title: 'PostaRocket Biblioteca', description: '' };
export default async function Index() { return <LibraryB2Component />; }
