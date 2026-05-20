import { Suspense } from 'react';
import SearchResults from '@/components/SearchResults';

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">読み込み中…</div>}>
      <SearchResults />
    </Suspense>
  );
}
