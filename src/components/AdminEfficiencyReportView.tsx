import React, { useState, useMemo } from 'react';
import { TrendingUp, Eye, FileText, Download } from 'lucide-react';
import { Transaksi, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AdminEfficiencyReportViewProps {
  transaksi: Transaksi[];
  users: User[];
}

export const AdminEfficiencyReportView: React.FC<AdminEfficiencyReportViewProps> = ({ transaksi, users }) => {
  const [selectedUnitDetail, setSelectedUnitDetail] = useState<string | null>(null);

  // Helper to parse DD/MM/YYYY
  const parseDate = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  };

  const months = useMemo(() => {
    const now = new Date(2026, 2, 2); // Fixed to metadata date March 2026
    const result = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: d.toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
        key: `${d.getFullYear()}-${d.getMonth()}`
      });
    }
    return result.reverse(); // Jan, Feb, Mar
  }, []);

  const efficiencyData = useMemo(() => {
    const units = [...new Set(users.map(u => u.Unit).filter(u => u))];
    const approvedTrans = transaksi.filter(t => (t.ACC || '').toUpperCase() === 'APPROVED');

    return units.map(unit => {
      const unitTrans = approvedTrans.filter(t => t.Unit === unit);
      const monthlyTotals: { [key: string]: number } = {};
      const monthlyItems: { [key: string]: Transaksi[] } = {};

      months.forEach(m => {
        const items = unitTrans.filter(t => {
          const d = parseDate(t.Tanggal);
          return d.getMonth() === m.month && d.getFullYear() === m.year;
        });
        monthlyTotals[m.key] = items.reduce((sum, item) => sum + (Number(item.Subtotal) || 0), 0);
        monthlyItems[m.key] = items;
      });

      const total3Months = Object.values(monthlyTotals).reduce((a, b) => a + b, 0);
      const average = total3Months / 3;

      return {
        unit,
        monthlyTotals,
        monthlyItems,
        total3Months,
        average
      };
    }).sort((a, b) => b.total3Months - a.total3Months);
  }, [transaksi, users, months]);

  const selectedData = useMemo(() => {
    if (!selectedUnitDetail) return null;
    return efficiencyData.find(d => d.unit === selectedUnitDetail);
  }, [selectedUnitDetail, efficiencyData]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-600/20">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none italic">Rekap Pengajuan Approved Per Unit</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Perbandingan Pengajuan Approved 3 Bulan Terakhir</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Unit Kerja</th>
                {months.map(m => (
                  <th key={m.key} className="px-6 py-4 text-center">{m.label}</th>
                ))}
                <th className="px-6 py-4 text-right">Total (3 Bln)</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {efficiencyData.map((data, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={data.unit} 
                  className="bg-slate-50/50 hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-5 rounded-l-2xl">
                    <p className="text-xs font-black text-slate-800 uppercase italic">{data.unit}</p>
                    <p className="text-[9px] font-bold text-blue-600 mt-1">Rata-rata: Rp {data.average.toLocaleString('id-ID')}</p>
                  </td>
                  {months.map(m => (
                    <td key={m.key} className="px-6 py-5 text-center font-black text-slate-700 text-xs">
                      Rp {data.monthlyTotals[m.key].toLocaleString('id-ID')}
                    </td>
                  ))}
                  <td className="px-6 py-5 text-right font-black text-blue-600 text-sm italic">
                    Rp {data.total3Months.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-5 text-center rounded-r-2xl">
                    <button 
                      onClick={() => setSelectedUnitDetail(data.unit)}
                      className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all shadow-sm group-hover:shadow-md"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedUnitDetail && selectedData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-2xl text-white">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 italic uppercase leading-none">{selectedUnitDetail}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Detail Pemakaian 3 Bulan Terakhir</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUnitDetail(null)}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <Eye size={20} className="rotate-45" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 custom-scrollbar space-y-6">
                {months.slice().reverse().map(m => {
                  const items = selectedData.monthlyItems[m.key];
                  if (items.length === 0) return null;
                  return (
                    <div key={m.key} className="space-y-2">
                      <div className="flex items-center justify-between border-b pb-1 border-slate-100">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{m.label}</h4>
                        <span className="text-[10px] font-black text-slate-800">Total: Rp {selectedData.monthlyTotals[m.key].toLocaleString('id-ID')}</span>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-slate-100">
                        <table className="w-full text-left bg-slate-50/30">
                          <thead>
                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/50">
                              <th className="px-4 py-2">Tanggal</th>
                              <th className="px-4 py-2">Nama Barang</th>
                              <th className="px-4 py-2 text-center">Qty</th>
                              <th className="px-4 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-white transition-colors">
                                <td className="px-4 py-1.5 text-[9px] font-bold text-slate-500">{item.Tanggal}</td>
                                <td className="px-4 py-1.5 text-[9px] font-black text-slate-800 uppercase italic">{item.NamaBarang}</td>
                                <td className="px-4 py-1.5 text-[9px] font-bold text-slate-600 text-center">{item.Qty}</td>
                                <td className="px-4 py-1.5 text-[9px] font-black text-blue-600 text-right">Rp {Number(item.Subtotal).toLocaleString('id-ID')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
                {Object.values(selectedData.monthlyItems).every((arr: any) => arr.length === 0) && (
                  <div className="py-20 text-center">
                    <p className="text-xs font-black text-slate-300 uppercase italic">Tidak ada detail pemakaian</p>
                  </div>
                )}
              </div>

              <div className="p-8 border-t bg-slate-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grand Total (3 Bln)</span>
                  <span className="text-2xl font-black text-slate-900 italic tracking-tighter">Rp {selectedData.total3Months.toLocaleString('id-ID')}</span>
                </div>
                <button 
                  onClick={() => setSelectedUnitDetail(null)}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-slate-900/20"
                >
                  TUTUP DETAIL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
