'use client';

import React, { useState } from 'react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReport: any) => void;
}

export default function ReportModal({ isOpen, onClose, onSuccess }: ReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [outageType, setOutageType] = useState('TOTAL_BLACKOUT');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolokasi tidak didukung oleh browser Anda.');
      return;
    }

    setDetectingGps(true);
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            setLocationName(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          } else {
            setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        } catch {
          setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        setErrorMsg('Gagal mendeteksi lokasi GPS: ' + err.message);
        setDetectingGps(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName) {
      setErrorMsg('Nama lokasi atau koordinat harus diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      let finalLat = latitude;
      let finalLng = longitude;

      // If user typed an address manually without GPS
      if (finalLat === null || finalLng === null) {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            locationName
          )}&format=json&limit=1`
        );
        if (geoRes.ok) {
          const results = await geoRes.json();
          if (results.length > 0) {
            finalLat = parseFloat(results[0].lat);
            finalLng = parseFloat(results[0].lon);
          } else {
            // Default center if not found
            finalLat = -6.2088;
            finalLng = 106.8456;
          }
        }
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName,
          latitude: finalLat,
          longitude: finalLng,
          outageType,
          rawContent: notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.report);
        onClose();
      } else {
        setErrorMsg(data.error || 'Gagal menyimpan laporan.');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <h2 className="text-lg font-bold text-white">Laporkan Pemadaman Listrik</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-sm px-2.5 py-1 rounded-md bg-zinc-800"
          >
            Batal
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Input & GPS detection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">Lokasi Pemadaman</label>
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={detectingGps}
                className="text-xs text-brand hover:text-brand-hover underline font-medium"
              >
                {detectingGps ? 'Mendeteksi...' : '[Gunakan GPS Saya]'}
              </button>
            </div>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Contoh: Jl. Fatmawati, Kebayoran Baru, Jakarta"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
              required
            />
            {latitude !== null && longitude !== null && (
              <p className="text-[11px] text-zinc-500 mt-1">
                Koordinat: {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            )}
          </div>

          {/* Outage Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Kondisi Gangguan
            </label>
            <select
              value={outageType}
              onChange={(e) => setOutageType(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-red-500"
            >
              <option value="TOTAL_BLACKOUT">Padam Total (Blackout)</option>
              <option value="BROWNOUT">Tegangan Anjlok / Listrik Kedip</option>
              <option value="TRANSFORMER_EXPLOSION">Gardu Meledak / Kabel Korslet</option>
              <option value="SCHEDULED_MAINTENANCE">Pemeliharaan Terjadwal</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Keterangan Tambahan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Sudah padam sejak 30 menit yang lalu, lampu jalan juga ikut mati..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition shadow-lg shadow-red-950"
            >
              {loading ? 'Mengirim Laporan...' : 'Kirim Laporan Pemadaman'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
