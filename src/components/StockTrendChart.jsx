import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Calendar } from 'lucide-react';

export default function StockTrendChart() {
  const [activeFilter, setActiveFilter] = useState('full'); // 'full' | 'ganjil' | 'genap'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // 12 Months of the Academic Year (Juli s.d Juni)
  const FULL_DATA = [
    { bulan: 'Juli', short: 'Jul', persen: 94.5, hadir: 1023, telat: 34, izin: 26, note: 'Awal Tahun Ajaran / MPLS' },
    { bulan: 'Agustus', short: 'Agu', persen: 96.8, hadir: 1048, telat: 21, izin: 14, note: 'Kegiatan HUT RI & Upacara' },
    { bulan: 'September', short: 'Sep', persen: 98.2, hadir: 1063, telat: 12, izin: 8, note: 'Puncak Kedisiplinan Tertinggi' },
    { bulan: 'Oktober', short: 'Okt', persen: 97.4, hadir: 1055, telat: 18, izin: 10, note: 'Bulan Bahasa & P5' },
    { bulan: 'November', short: 'Nov', persen: 96.9, hadir: 1049, telat: 22, izin: 12, note: 'Bulan Berjalan (Aktif)' },
    { bulan: 'Desember', short: 'Des', persen: 93.4, hadir: 1011, telat: 38, izin: 34, note: 'Penilaian Akhir Semester' },
    { bulan: 'Januari', short: 'Jan', persen: 97.5, hadir: 1056, telat: 16, izin: 11, note: 'Awal Semester Genap' },
    { bulan: 'Februari', short: 'Feb', persen: 98.0, hadir: 1061, telat: 14, izin: 8, note: 'Persiapan Uji Kompetensi' },
    { bulan: 'Maret', short: 'Mar', persen: 96.2, hadir: 1042, telat: 25, izin: 16, note: 'Prakerin & Ujian Praktik' },
    { bulan: 'April', short: 'Apr', persen: 95.8, hadir: 1037, telat: 28, izin: 18, note: 'Jadwal Khusus Ramadhan' },
    { bulan: 'Mei', short: 'Mei', persen: 97.1, hadir: 1052, telat: 19, izin: 12, note: 'Penilaian Akhir Tahun' },
    { bulan: 'Juni', short: 'Jun', persen: 93.8, hadir: 1016, telat: 35, izin: 32, note: 'Pekan Remedial & Rapor' }
  ];

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

  const minVal = 90; // 90%
  const maxVal = 100; // 100%

  const getX = (idx) => paddingX + (idx / (currentData.length - 1)) * (width - 2 * paddingX);
  const getY = (val) => height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);

  // Generate SVG cubic bezier path
  const points = currentData.map((d, i) => ({ x: getX(i), y: getY(d.persen) }));
  
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
  const values = currentData.map((d) => d.persen);
  const maxPersen = Math.max(...values);
  const minPersen = Math.min(...values);
  const peakMonth = currentData.find((d) => d.persen === maxPersen);
  const dipMonth = currentData.find((d) => d.persen === minPersen);

  // Delta comparison (last 2 points)
  const lastIdx = currentData.length - 1;
  const delta = (currentData[lastIdx].persen - currentData[lastIdx - 1]?.persen).toFixed(1);
  const isUp = delta >= 0;

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
                Grafik Tren Kehadiran Siswa
              </h3>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {isUp ? `+${delta}%` : `${delta}%`} vs Bln Lalu
              </span>
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
          <span className="font-heading font-extrabold text-sm text-[#172B4D]">{activeItem?.bulan} 2026</span>
          <span className="text-[10px] text-slate-500 block truncate">{activeItem?.note}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">Puncak Disiplin</span>
          <span className="font-heading font-extrabold text-sm text-emerald-800">{peakMonth?.persen}%</span>
          <span className="text-[10px] text-emerald-600 block">{peakMonth?.bulan}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">Lembah Penurunan</span>
          <span className="font-heading font-extrabold text-sm text-amber-800">{dipMonth?.persen}%</span>
          <span className="text-[10px] text-amber-600 block">{dipMonth?.bulan}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/60">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#315E9E] block">Rata-Rata Tahunan</span>
          <span className="font-heading font-extrabold text-sm text-[#172B4D]">
            {(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}%
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

            {/* Grid Horizontal Guidelines */}
            {[90, 92.5, 95, 97.5, 100].map((val) => {
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
            {areaD && <path d={areaD} fill="url(#stockGradient)" />}

            {/* Spline Stroke Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Dots & Hover Hitboxes */}
            {currentData.map((d, i) => {
              const x = getX(i);
              const y = getY(d.persen);
              const isHovered = hoveredIndex === i;

              return (
                <g
                  key={d.bulan}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setHoveredIndex(i)}
                  className="cursor-pointer"
                >
                  {/* Invisible generous hitbox for easy mouse/touch */}
                  <rect
                    x={x - 20}
                    y={paddingY}
                    width={40}
                    height={height - 2 * paddingY}
                    fill="transparent"
                  />

                  {/* Vertical hover marker line */}
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

                  {/* Dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 7 : 4.5}
                    fill={isHovered ? '#10B981' : '#FFFFFF'}
                    stroke={isHovered ? '#FFFFFF' : '#315E9E'}
                    strokeWidth={isHovered ? 2.5 : 2}
                    className="transition-all duration-200"
                  />

                  {/* Month Label */}
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

                  {/* Percentage label above dot on hover */}
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
                        {d.persen}%
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
