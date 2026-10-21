'use client';

import React, { useState } from 'react';
import { HeatPoint } from '@/lib/reportsService';

interface LiveFeedProps {
  reports: HeatPoint[];
  onSelectReport: (report: HeatPoint) => void;
  onTriggerScrape: () => void;
  isScraping: boolean;
}

export default function LiveFeed({
  reports,
  onSelectReport,
  onTriggerScrape,
  isScraping,
}: LiveFeedProps) {
  const [filter, setFilter] = useState<'ALL' | 'USER' | 'SCRAPED'>('ALL');

  const filtered = reports.filter((r) => {
    if (filter === 'USER') return r.sourceType === 'USER_REPORT';
    if (filter === 'SCRAPED') return r.sourceType !== 'USER_REPORT';
    return true;
  });

  const formatTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} menit lalu`;
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} jam lalu`;
    } catch {
      return '';
    }
  };

  const getSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'USER_REPORT':
        return { label: 'Warga', bg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800' };
      case 'SCRAPED_TWITTER':
        return { label: 'Twitter', bg: 'bg-sky-950/80 text-sky-400 border-sky-800' };
      case 'SCRAPED_BLUESKY':
        return { label: 'Bluesky', bg: 'bg-blue-950/80 text-blue-400 border-blue-800' };
      case 'SCRAPED_PORTAL':
        return { label: 'Portal PLN', bg: 'bg-amber-950/80 text-amber-400 border-amber-800' };
      default:
        return { label: 'Sosial Media', bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/95 border-r border-zinc-800 text-zinc-100">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-bold text-sm tracking-wider uppercase text-white">
              Arus Laporan Langsung
            </h2>
          </div>
          <button
            onClick={onTriggerScrape}
            disabled={isScraping}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-700 transition"
          >
            {isScraping ? 'Memindai...' : 'Pindai Sosmed'}
          </button>
        </div>

        {/* Filter buttons */}
        <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setFilter('ALL')}
            className={`text-xs py-1 rounded-md font-medium transition ${
              filter === 'ALL' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Semua ({reports.length})
          </button>
          <button
            onClick={() => setFilter('USER')}
            className={`text-xs py-1 rounded-md font-medium transition ${
              filter === 'USER' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Warga
          </button>
          <button
            onClick={() => setFilter('SCRAPED')}
            className={`text-xs py-1 rounded-md font-medium transition ${
              filter === 'SCRAPED' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sosmed
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-500">
            Belum ada laporan dalam kategori ini.
          </div>
        ) : (
          filtered.map((item) => {
            const badge = getSourceBadge(item.sourceType);
            return (
              <div
                key={item.id}
                onClick={() => onSelectReport(item)}
                className="p-3 rounded-lg hover:bg-zinc-800/60 cursor-pointer transition border border-transparent hover:border-zinc-700/50"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[11px] text-zinc-500">{formatTime(item.reportedAt)}</span>
                </div>

                <h4 className="text-xs font-semibold text-zinc-200 line-clamp-1 mb-1">
                  {item.locationName}
                </h4>

                {item.rawContent && (
                  <p className="text-xs text-zinc-400 line-clamp-2 italic mb-2">
                    "{item.rawContent}"
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span className="text-red-400/90 font-medium">
                    Intensitas: {item.weight.toFixed(1)}
                  </span>
                  <span>{item.confirmationsCount} Konfirmasi</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
