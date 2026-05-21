import { Suspense } from 'react';
import SearchLanding from '@/components/SearchLanding';

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchLanding />
    </Suspense>
  );
}
