import React, { useState } from 'react';
import { Transaksi, OrderGroup } from '../types';

interface AdminApprovalViewProps {
  transaksi: Transaksi[];
  onProcess: (group: OrderGroup) => void;
}

export const AdminApprovalView: React.FC<AdminApprovalViewProps> = ({ transaksi, onProcess }) => {
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const parseDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return new Date(dateStr);
  };

  const groupTransactions = (items: Transaksi[]): OrderGroup[] => {
    const groups: { [key: string]: OrderGroup } = {};
    items.forEach((t) => {
      if (!groups[t.Idorder]) {
        groups[t.Idorder] = {
          id: t.Idorder,
          tanggal: t.Tanggal,
          unit: t.Unit,
          status: t.ACC || 'Pending',
          items: [],
          total: 0,
          totalApproved: 0,
        };
      }
      groups[t.Idorder].items.push(t);
      groups[t.Idorder].total += parseFloat(t.Subtotal as any) || 0;
      if ((t.ACC || '').toLowerCase() === 'approved') {
        groups[t.Idorder].totalApproved += (t.Harga * (t.JmlACC || 0)) || 0;
      }
    });
    return Object.values(groups).reverse();
  };

  const filteredTransaksi = transaksi.filter((t) => {
    const matchesTab = (t.ACC || 'Pending').toLowerCase() === tab;
    if (!matchesTab) return false;

    const tDate = parseDate(t.Tanggal);
    if (tDate) {
      if (startDate && tDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        if (tDate > end) return false;
      }
    } else if (startDate || endDate) {
      return false;
    }

    return true;
  });
  const groups = groupTransactions(filteredTransaksi);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">Persetujuan Pesanan</h2>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1">
            <div className="flex flex-col">
              <span className="text-[6px] font-black text-slate-400 uppercase leading-none">Dari</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-[9px] font-bold outline-none cursor-pointer"
              />
            </div>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            <div className="flex flex-col">
              <span className="text-[6px] font-black text-slate-400 uppercase leading-none">Sampai</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-[9px] font-bold outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
              tab === 'pending' ? 'bg-white shadow text-amber-600' : 'text-slate-500'
            }`}
          >
            Antrian
          </button>
          <button
            onClick={() => setTab('approved')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${
              tab === 'approved' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'
            }`}
          >
            Riwayat
          </button>
        </div>
      </div>
      <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase">Unit</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase">Tanggal</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase">ID Order</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase text-right">Total</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-300 font-black text-[10px] uppercase">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              groups.map((g, idx) => (
                <tr key={`appr-${g.id}-${idx}`}>
                  <td className="px-6 py-2 text-[10px] font-black uppercase italic">{g.unit}</td>
                  <td className="px-6 py-2 text-[10px] font-bold text-slate-500">{g.tanggal}</td>
                  <td className="px-6 py-2 font-black text-blue-600 text-[10px]">{g.id}</td>
                  <td className="px-6 py-2 text-right text-[10px] font-black">
                    Rp {g.total.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-2 text-center">
                    <button
                      onClick={() => onProcess(g)}
                      className="bg-slate-900 text-white px-3 py-1 rounded text-[8px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                      PROSES
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
