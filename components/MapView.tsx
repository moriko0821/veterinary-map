'use client';

import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Clinic } from '@/lib/supabase';

type Props = {
  clinics: Clinic[];
  height?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  mapStyle?: 'default' | 'dark' | 'light' | 'minimal';
  markerColor?: string;
  onSelect?: (clinic: Clinic) => void;
  selectedId?: string | null;
  fitToClinics?: boolean; // true なら clinics 全件が収まるよう自動ズーム
};

// Snazzymaps風のシンプルスタイル
const MAP_STYLES: Record<string, google.maps.MapTypeStyle[]> = {
  default: [],
  dark: [
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  ],
  light: [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e7f5' }] },
  ],
  minimal: [
    { elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dddddd' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  ],
};

export default function MapView({
  clinics,
  height = '100vh',
  initialCenter = { lat: 35.681236, lng: 139.767125 }, // 東京駅 (全国向けデフォルト)
  initialZoom = 11,
  mapStyle = 'default',
  markerColor,
  onSelect,
  selectedId = null,
  fitToClinics = false,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    language: 'ja',
    region: 'JP',
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const styles = useMemo(() => MAP_STYLES[mapStyle] ?? [], [mapStyle]);

  // fitToClinics: clinics が変わるたびに全件が収まるように bounds を計算
  useEffect(() => {
    if (!isLoaded || !fitToClinics || !mapRef.current) return;
    const valid = clinics.filter((c) => c.lat !== null && c.lng !== null);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      mapRef.current.setCenter({ lat: valid[0].lat!, lng: valid[0].lng! });
      mapRef.current.setZoom(13);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    valid.forEach((c) => bounds.extend({ lat: c.lat!, lng: c.lng! }));
    mapRef.current.fitBounds(bounds, 60);
  }, [clinics, isLoaded, fitToClinics]);

  // 選択された病院があれば、その位置にパンする
  useEffect(() => {
    if (!isLoaded || !selectedId || !mapRef.current) return;
    const sel = clinics.find((c) => c.id === selectedId);
    if (sel && sel.lat !== null && sel.lng !== null) {
      mapRef.current.panTo({ lat: sel.lat, lng: sel.lng });
    }
  }, [selectedId, clinics, isLoaded]);

  if (!isLoaded) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-100 text-gray-500"
      >
        地図を読み込み中…
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height }}
      center={initialCenter}
      zoom={initialZoom}
      onLoad={(m) => {
        mapRef.current = m;
      }}
      onUnmount={() => {
        mapRef.current = null;
      }}
      options={{
        styles,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
      }}
    >
      {clinics
        .filter((c) => c.lat !== null && c.lng !== null)
        .map((c) => {
          const isSelected = c.id === selectedId;
          return (
            <MarkerF
              key={c.id}
              position={{ lat: c.lat!, lng: c.lng! }}
              title={c.name}
              zIndex={isSelected ? 999 : undefined}
              onClick={() => onSelect?.(c)}
              icon={
                markerColor
                  ? {
                      path: google.maps.SymbolPath.CIRCLE,
                      fillColor: isSelected ? '#FFFFFF' : markerColor,
                      fillOpacity: 1,
                      strokeColor: isSelected ? markerColor : '#ffffff',
                      strokeWeight: isSelected ? 4 : 2,
                      scale: isSelected ? 12 : 8,
                    }
                  : undefined
              }
            />
          );
        })}
    </GoogleMap>
  );
}
