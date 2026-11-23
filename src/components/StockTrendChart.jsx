import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, RefreshCw } from 'lucide-react';
import { apiCall, getDeviceTime } from '../utils/api';

// Template 12 bulan tahun ajaran (Juli - Juni), semua mulai 0
const MONTH_TEMPLATE = [
  { bulan: 'Juli',      short: 'Jul', note: 'Awal Tahun Ajaran / MPLS' },
  { bulan: 'Agustus',   short: 'Agu', note: 'Kegiatan HUT RI & Upacara' },
  { bulan: 'September', short: 'Sep', note: 'Penilaian Tengah Semester' },
  { bulan: 'Oktober',   short: 'Okt', note: 'Bulan Bahasa & P5' },
  { bulan: 'November',  short: 'Nov', note: 'Kegiatan Bulanan' },
  { bulan: 'Desember',  short: 'Des', note: 'Penilaian Akhir Semester' },
  { bulan: 'Januari',   short: 'Jan', note: 'Awal Semester Genap' },
  { bulan: 'Februari',  short: 'Feb', note: 'Persiapan Uji Kompetensi' },
  { bulan: 'Maret',     short: 'Mar', note: 'Prakerin & Ujian Praktik' },
  { bulan: 'April',     short: 'Apr', note: 'Kegiatan April' },
  { bulan: 'Mei',       short: 'Mei', note: 'Penilaian Akhir Tahun' },
  { bulan: 'Juni',      short: 'Jun', note: 'Pekan Remedial & Rapor' }
];

export default function StockTrendChart() {
  const [activeFilter, setActiveFilter] = useState('full');
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [FULL_DATA, setFullData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [hasRealData, setHasRealData] = useState(false);

  const fetchBulanan = async () => {
    setLoadingChart(true);
    try {
      const devTime = getDeviceTime();
      const res = await apiCall('getRekapBulanan', { tahunAjaran: '2026/2027' }, null);
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        // Merge template dengan data real dari API
        const merged = MONTH_TEMPLATE.map((tmpl) => {
          const found = res.data.find(d => d.bulan === tmpl.bulan);
          return {
            ...tmpl,
            persen: found ? (found.persen || 0) : 0,
            hadir: found ? (found.hadir || 0) : 0,
            telat: found ? (found.telat || 0) : 0,
            izin: found ? (found.izin || 0) : 0,
          };
        });
        const hasAny = merged.some(m => m.persen > 0);
        setFullData(merged);
        setHasRealData(hasAny);
      } else {
        // Tidak ada data sama sekali: semua 0
        setFullData(MONTH_TEMPLATE.map(t => ({ ...t, persen: 0, hadir: 0, telat: 0, izin: 0 })));
        setHasRealData(false);
      }
    } catch {
      // Fallback: semua 0, tidak ada data
      setFullData(MONTH_TEMPLATE.map(t => ({ ...t, persen: 0, hadir: 0, telat: 0, izin: 0 })));
      setHasRealData(false);
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    fetchBulanan();
  }, []);

  const currentData = activeFilter === 'ganjil'
    ? FULL_DATA.slice(0, 6)
    : activeFilter === 'genap'
    ? FULL_DATA.slice(6, 12)
    : FULL_DATA;

  // Chart dimensions & coordinates
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 35;

  const minVal = 0; // Mulai dari 0%
  const maxVal = 100; // 100%

  const getX = (idx) => paddingX + (idx / Math.max(1, currentData.length - 1)) * (width - 2 * paddingX);
  const getY = (val) => height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);

  // Generate SVG cubic bezier path
  const points = currentData.map((d, i) => ({ x: getX(i), y: getY(d.persen || 0) }));
  
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
  }

  const areaD = pathD ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z` : '';

  // Stats calculation
  const values = currentData.map((d) => d.persen || 0);
  const maxPersen = values.length ? Math.max(...values) : 0;
  const minPersen = values.length ? Math.min(...values) : 0;
  const peakMonth = currentData.find((d) => (d.persen || 0) === maxPersen) || currentData[0];
  const dipMonth = currentData.find((d) => (d.persen || 0) === minPersen) || currentData[0];

  // Delta comparison (last 2 points)
  const lastIdx = currentData.length - 1;
  const delta = currentData.length > 1 ? ((currentData[lastIdx]?.persen || 0) - (currentData[lastIdx - 1]?.persen || 0)).toFixed(1) : "0.0";
  const isUp = Number(delta) >= 0;

  const activeItem = hoveredIndex !== null ? currentData[hoveredIndex] : currentData[currentData.length - 1];

  return (
    <div className="card p-5 sm:p-6 space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#315E9E] flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-base text-[#172B4D]">
                Grafik Kehadiran Siswa
              </h3>
              {hasRealData && (
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                  isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isUp ? `+${delta}%` : `${delta}%`} vs Bln Lalu
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Fluktuasi kedisiplinan dan rata-rata absensi per bulan (Tahun Ajaran 2026/2027)
            </p>
          </div>
        </div>

        {/* Filter Pill */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveFilter('full')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'full' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1 Tahun Penuh
          </button>
          <button
            onClick={() => setActiveFilter('ganjil')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'ganjil' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sem. Ganjil
          </button>
          <button
            onClick={() => setActiveFilter('genap')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeFilter === 'genap' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sem. Genap
          </button>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Fokus Sorotan</span>
          <span className="font-heading font-extrabold text-sm text-[#172B4D]">{activeItem?.bulan || '-'}</span>
          <span className="text-[10px] text-slate-500 block truncate">{hasRealData ? activeItem?.note : 'Belum ada aktivitas'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">Puncak Disiplin</span>
          <span className="font-heading font-extrabold text-sm text-emerald-800">{hasRealData ? `${peakMonth?.persen || 0}%` : '0%'}</span>
          <span className="text-[10px] text-emerald-600 block">{hasRealData ? peakMonth?.bulan : '-'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">Lembah Penurunan</span>
          <span className="font-heading font-extrabold text-sm text-amber-800">{hasRealData ? `${dipMonth?.persen || 0}%` : '0%'}</span>
          <span className="text-[10px] text-amber-600 block">{hasRealData ? dipMonth?.bulan : '-'}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/60">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#315E9E] block">Rata-Rata Tahunan</span>
          <span className="font-heading font-extrabold text-sm text-[#172B4D]">
            {hasRealData && values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0}%
          </span>
          <span className="text-[10px] text-blue-600 block">Target: &gt;95%</span>
        </div>
      </div>

      {/* SVG Responsive Chart Viewport */}
      <div className="relative w-full overflow-x-auto pb-2">
        <div className="min-w-[620px] w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
            <defs>
              <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#315E9E" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#10B981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#315E9E" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Grid Horizontal Guidelines: 0, 25, 50, 75, 100 */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400 font-medium"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            {hasRealData && areaD && <path d={areaD} fill="url(#stockGradient)" />}

            {/* Spline Stroke Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={hasRealData ? "url(#lineGrad)" : "#CBD5E1"}
                strokeWidth={hasRealData ? "3.5" : "2"}
                strokeDasharray={hasRealData ? "none" : "5 5"}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Dots & Hover Hitboxes */}
            {currentData.map((d, i) => {
              const x = getX(i);
              const y = getY(d.persen || 0);
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={d.bulan}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setHoveredIndex(i)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x - 20}
                    y={paddingY}
                    width={40}
                    height={height - 2 * paddingY}
                    fill="transparent"
                  />

                  {isHovered && (
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={height - paddingY}
                      stroke="#315E9E"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 7 : 4.5}
                    fill={isHovered ? '#10B981' : '#FFFFFF'}
                    stroke={isHovered ? '#FFFFFF' : '#315E9E'}
                    strokeWidth={isHovered ? 2.5 : 2}
                    className="transition-all duration-200"
                  />

                  <text
                    x={x}
                    y={height - 12}
                    textAnchor="middle"
                    className={`text-[11px] font-heading font-semibold transition-colors ${
                      isHovered ? 'fill-[#172B4D] font-extrabold' : 'fill-slate-500'
                    }`}
                  >
                    {d.short}
                  </text>

                  {isHovered && (
                    <g transform={`translate(${x}, ${y - 12})`}>
                      <rect
                        x="-24"
                        y="-16"
                        width="48"
                        height="18"
                        rx="6"
                        fill="#172B4D"
                      />
                      <text
                        x="0"
                        y="-4"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        className="text-[10px] font-mono font-bold"
                      >
                        {d.persen || 0}%
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
