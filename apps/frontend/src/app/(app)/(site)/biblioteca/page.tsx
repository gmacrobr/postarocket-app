export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { LibraryComponent } from '@gitroom/frontend/components/library/library.component';

export const metadata: Metadata = {
  title: 'PostaRocket Biblioteca',
  description: '',
};

export default async function Index() {
  return <LibraryComponent />;
}
