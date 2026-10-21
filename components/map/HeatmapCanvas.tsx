'use client';

import React, { useEffect, useRef, useState } from 'react';
import { HeatPoint } from '@/lib/reportsService';

interface HeatmapCanvasProps {
  points: HeatPoint[];
  onSelectPoint?: (point: HeatPoint) => void;
  onVerify?: (pointId: string, action: 'confirm_outage' | 'confirm_restored') => void;
}

export default function HeatmapCanvas({ points, onSelectPoint, onVerify }: HeatmapCanvasProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [selectedPoint, setSelectedPoint] = useState<HeatPoint | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;
      // Load leaflet styles
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Initialize map centered on Jakarta/Java
        const map = L.map(mapContainerRef.current, {
          center: [-6.2088, 106.8456],
          zoom: 11,
          zoomControl: false,
        });

        // Add Dark Matter OSM tiles (free CartoDB dark tiles)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = L.layerGroup().addTo(map);
      }

      if (!isMounted || !mapInstanceRef.current) return;
      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      markersLayer.clearLayers();

      // Render heat circles & interactive markers
      points.forEach((pt) => {
        const radius = Math.min(2500, Math.max(800, pt.weight * 500));
        
        let fillColor = '#10b981'; // green / low
        if (pt.weight >= 3.0) fillColor = '#ef4444'; // high / red
        else if (pt.weight >= 1.5) fillColor = '#f97316'; // orange / medium
        else if (pt.weight >= 0.8) fillColor = '#f59e0b'; // amber / low-med

        // Heat pulse circle
        const heatCircle = L.circle([pt.lat, pt.lng], {
          radius: radius,
          fillColor: fillColor,
          fillOpacity: 0.35,
          color: fillColor,
          weight: 1,
          opacity: 0.6,
        }).addTo(markersLayer);

        // Core hotspot pin
        const centerMarker = L.circleMarker([pt.lat, pt.lng], {
          radius: 7,
          fillColor: fillColor,
          fillOpacity: 0.9,
          color: '#ffffff',
          weight: 1.5,
        }).addTo(markersLayer);

        centerMarker.on('click', () => {
          setSelectedPoint(pt);
          if (onSelectPoint) onSelectPoint(pt);
          map.setView([pt.lat, pt.lng], Math.max(map.getZoom(), 13));
        });

        heatCircle.on('click', () => {
          setSelectedPoint(pt);
          if (onSelectPoint) onSelectPoint(pt);
        });
      });
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [points]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full bg-zinc-950 z-0" />

      {/* Selected Point Details Panel */}
      {selectedPoint && (
        <div className="absolute top-4 left-4 z-[1000] w-80 @md/app:w-96 bg-zinc-900/95 border border-zinc-800 rounded-xl p-4 shadow-2xl backdrop-blur-md text-zinc-100">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                {selectedPoint.outageType.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-zinc-400 hover:text-zinc-200 text-xs px-2 py-1 rounded bg-zinc-800"
            >
              Tutup
            </button>
          </div>

          <h3 className="font-bold text-base text-white mb-1">{selectedPoint.locationName}</h3>
          <p className="text-xs text-zinc-400 mb-2">
            Sumber: {selectedPoint.sourceType.replace('_', ' ')} | Konfirmasi: {selectedPoint.confirmationsCount}
          </p>

          {selectedPoint.rawContent && (
            <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-800/80 text-xs text-zinc-300 italic mb-3">
              "{selectedPoint.rawContent}"
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-zinc-800">
            <button
              onClick={() => {
                if (onVerify) onVerify(selectedPoint.id, 'confirm_outage');
                setSelectedPoint((prev) =>
                  prev ? { ...prev, confirmationsCount: prev.confirmationsCount + 1 } : null
                );
              }}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-2 px-3 rounded-lg font-medium transition"
            >
              Saya Juga Padam
            </button>
            <button
              onClick={() => {
                if (onVerify) onVerify(selectedPoint.id, 'confirm_restored');
                setSelectedPoint((prev) =>
                  prev ? { ...prev, status: 'RESTORED' } : null
                );
              }}
              className="w-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs py-2 px-3 rounded-lg font-medium transition"
            >
              Sudah Nyala
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
