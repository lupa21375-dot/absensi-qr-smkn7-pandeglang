import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Printer, RefreshCw, Filter } from 'lucide-react';
import { ALL_STUDENTS } from '../data/students';

export default function CetakQR({ user, addToast }) {
  const [selectedClass, setSelectedClass] = useState('X AKL 1');
  const [cards, setCards] = useState([]);
  const [generating, setGenerating] = useState(false);

  // Distinct classes
  const classList = [...new Set(ALL_STUDENTS.map((s) => s.kelas))].sort((a, b) => {
    const order = { X: 0, XI: 1, XII: 2 };
    const orderA = order[a.split(' ')[0]] ?? 99;
    const orderB = order[b.split(' ')[0]] ?? 99;
    return orderA - orderB || a.localeCompare(b, 'id', { numeric: true });
  });

  const generateCards = async () => {
    setGenerating(true);
    const targetStudents = ALL_STUDENTS.filter(
      (s) => s.kelas === selectedClass && s.aktif !== false
    );

    const generated = await Promise.all(
      targetStudents.map(async (student) => {
        try {
          const qrDataUrl = await QRCode.toDataURL(student.kode, {
            width: 140,
            margin: 1,
            color: {
              dark: '#172B4D',
              light: '#FFFFFF'
            }
          });
          return {
            ...student,
            qrUrl: qrDataUrl
          };
        } catch (err) {
          console.warn('QR generate error', err);
          return null;
        }
      })
    );

    setCards(generated.filter(Boolean));
    setGenerating(false);
    addToast(`${generated.length} kartu QR siap dicetak untuk ${selectedClass}`, 'success');
  };

  useEffect(() => {
    generateCards();
  }, [selectedClass]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Control Bar (hidden during print) */}
      <div className="card p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Pilih Kelas:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="input-field text-xs font-bold w-full sm:w-56 cursor-pointer"
          >
            {classList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={generateCards}
            disabled={generating}
            className="btn-secondary flex-1 sm:flex-none py-2 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>Generate Ulang</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu ({cards.length})</span>
          </button>
        </div>
      </div>

      {/* Grid of Printable Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 justify-items-center">
        {cards.map((student) => (
          <div
            key={student.kode}
            style={{ width: '85.6mm', height: '54mm' }}
            className="rounded-[4mm] border border-[#172B4D] bg-white text-[#172B4D] p-[4mm] flex items-center gap-[4mm] shadow-md relative overflow-hidden break-inside-avoid shrink-0 select-none"
          >
            {/* School Header Background Accent */}
            <div className="absolute top-0 left-0 right-0 h-[3mm] bg-[#172B4D]" />

            {/* Left QR Image */}
            <div className="w-[34mm] h-[34mm] border border-slate-200 rounded-lg p-1 bg-white shrink-0 flex items-center justify-center">
              {student.qrUrl && (
                <img src={student.qrUrl} alt={student.kode} className="w-full h-full object-contain" />
              )}
            </div>

            {/* Right Student Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between h-[36mm]">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <img src="./logo.png" alt="Logo" className="w-4 h-4 object-contain" />
                  <span className="text-[8px] font-bold tracking-tight text-slate-500 uppercase">
                    SMKN 7 Pandeglang
                  </span>
                </div>
                <h4 className="font-heading font-extrabold text-[12px] leading-tight text-[#172B4D] line-clamp-2">
                  {student.nama}
                </h4>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                  {student.kelas}
                </p>
              </div>

              <div className="pt-1 border-t border-slate-200">
                <span className="text-[8px] text-slate-400 block font-medium">KODE KARTU SISWA:</span>
                <code className="text-[11px] font-mono font-bold tracking-widest text-[#315E9E] block">
                  {student.kode}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
