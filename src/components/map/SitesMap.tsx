"use client";
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface MapSite { id: string; name: string; lat: number; lng: number; state: 'good' | 'poor' | 'unchecked'; detail: string }
const COLOUR = { good: '#287A4B', poor: '#B44343', unchecked: '#C3A36A' };

export function SitesMap({ sites }: { sites: MapSite[] }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import('leaflet').Map | undefined;
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false }).setView([0.2, 37.9], 6);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      const points: [number, number][] = [];
      for (const s of sites) {
        const box = document.createElement('div');
        const title = document.createElement('strong'); title.textContent = s.name;
        const text = document.createElement('div'); text.textContent = s.detail;
        const link = document.createElement('a'); link.href = `/restoration/sites/${s.id}`; link.textContent = 'Open site';
        box.append(title, text, link);
        L.circleMarker([s.lat, s.lng], { radius: 9, color: '#ffffff', weight: 2, fillColor: COLOUR[s.state], fillOpacity: 0.9 }).bindPopup(box).addTo(map);
        points.push([s.lat, s.lng]);
      }
      if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 12 });
      else if (points.length === 1) map.setView(points[0], 11);
    });
    return () => { cancelled = true; map?.remove(); };
  }, [sites]);
  return <div ref={el} role="region" aria-label="Map of planting sites" className="h-[28rem] w-full overflow-hidden rounded-xl border sm:h-[34rem]" />;
}
