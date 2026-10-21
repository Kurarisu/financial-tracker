'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { HeatPoint } from '@/lib/reportsService';

const HeatmapCanvas = dynamic(() => import('./HeatmapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-400">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm font-medium">Memuat Peta Pemadaman...</p>
      </div>
    </div>
  ),
});

interface OutageMapProps {
  points: HeatPoint[];
  onSelectPoint?: (point: HeatPoint) => void;
  onVerify?: (pointId: string, action: 'confirm_outage' | 'confirm_restored') => void;
}

export default function OutageMap(props: OutageMapProps) {
  return <HeatmapCanvas {...props} />;
}
