'use client';
import { Search, Heart, PawPrint } from 'lucide-react';
import MapView from '@/components/MapView';
import type { Clinic } from '@/lib/supabase';

export default function Design2({ clinics }: { clinics: Clinic[] }) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-rose-50">
      <div className="absolute top-0 inset-x-0 z-10 px-4 pt-4 pb-3 bg-linear-to-b from-rose-100/95 to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <PawPrint className="text-rose-500" size={22} />
          <h1 className="font-bold text-rose-900 text-lg">みんなの動物病院</h1>
          <Heart className="ml-auto text-rose-400" size={20} />
        </div>
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-md">
          <Search size={18} className="text-rose-400" />
          <input
            placeholder="病院をさがす🐾"
            className="flex-1 outline-none text-sm placeholder:text-rose-300"
          />
        </div>
      </div>

      <MapView clinics={clinics} height="100dvh" mapStyle="light" markerColor="#F472B6" />

      <div className="absolute inset-x-0 bottom-0 z-10 bg-white/95 backdrop-blur rounded-t-4xl shadow-2xl h-[40vh] p-5 overflow-y-auto">
        <div className="w-12 h-1 rounded-full bg-rose-200 mx-auto mb-3" />
        <h2 className="text-rose-900 font-bold mb-3">あなたのまわりの病院</h2>
        <ul className="space-y-3">
          {clinics.slice(0, 8).map((c, i) => (
            <li key={c.id} className="bg-rose-50 rounded-2xl p-3 flex gap-3">
              <div className="w-12 h-12 rounded-full bg-linear-to-br from-rose-300 to-orange-300 flex items-center justify-center text-2xl shrink-0">
                {['🐶', '🐱', '🐰', '🐦', '🐹'][i % 5]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-rose-900 truncate">{c.name}</div>
                <div className="text-xs text-rose-600 mt-0.5 truncate">
                  {c.address?.slice(0, 30)}
                </div>
                <div className="flex gap-2 mt-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    ★{c.rating ?? '-'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    💬{c.review_count}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
