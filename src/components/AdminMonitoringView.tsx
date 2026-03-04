import React, { useState } from 'react';
import { Eye, Edit2 } from 'lucide-react';
import { Transaksi, OrderGroup } from '../types';

interface AdminMonitoringViewProps {
  transaksi: Transaksi[];
  onEditOrder: (idOrder: string) => void;
  onViewDetail: (group: OrderGroup) => void;
}

export const AdminMonitoringView: React.FC<AdminMonitoringViewProps> = ({ transaksi, onEditOrder, onViewDetail }) => {
  const [tab, setTab] = useState<'pending' | 'approved' | 'received' | 'rejected'>('pending');

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
    if (tab === 'received') {
      return String(t.TerimaBarang).toUpperCase() === 'YA';
    } else if (tab === 'approved') {
      return (t.ACC || 'Pending').toLowerCase() === 'approved' && String(t.TerimaBarang).toUpperCase() !== 'YA';
    } else if (tab === 'rejected') {
      return (t.ACC || 'Pending').toLowerCase() === 'tolak';
    } else {
      return (t.ACC || 'Pending').toLowerCase() === 'pending';
    }
  });

  const groups = groupTransactions(filteredTransaksi);
  const grandTotal = groups.reduce((acc, g) => acc + g.totalApproved, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-[14px] font-black uppercase tracking-widest text-slate-800 italic">Monitoring Pengadaan</h2>
          <div className="bg-blue-600 px-8 py-2.5 rounded-[1.2rem] shadow-2xl shadow-blue-600/30 flex flex-col items-center border-2 border-blue-400">
            <span className="text-[9px] font-black text-blue-100 uppercase tracking-[0.2em] mb-0.5">Grand Total Approved</span>
            <span className="text-[18px] font-black text-white leading-none tracking-tighter">Rp {grandTotal.toLocaleString('id-ID')}</span>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
              tab === 'pending' ? 'bg-white shadow text-amber-600' : 'text-slate-500'
            }`}
          >
            Proses
          </button>
          <button
            onClick={() => setTab('approved')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
              tab === 'approved' ? 'bg-white shadow text-emerald-600' : 'text-slate-500'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setTab('received')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
              tab === 'received' ? 'bg-white shadow text-blue-600' : 'text-slate-500'
            }`}
          >
            Diterima
          </button>
          <button
            onClick={() => setTab('rejected')}
            className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
              tab === 'rejected' ? 'bg-white shadow text-red-600' : 'text-slate-500'
            }`}
          >
            Ditolak
          </button>
        </div>
      </div>
      <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[650px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase">Unit</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase">Tanggal</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase">ID Order</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase text-right">Total Pengajuan</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase text-right">Total Approved</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
              <th className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase text-center">Opsi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 italic">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-300 font-black text-[10px] uppercase">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              groups.map((g, idx) => (
                <tr key={`mon-${g.id}-${idx}`}>
                  <td className="px-6 py-2 text-[11px] font-black uppercase italic">{g.unit}</td>
                  <td className="px-6 py-2 text-[11px] font-bold text-slate-500">{g.tanggal}</td>
                  <td className="px-6 py-2 font-black text-slate-800 text-[11px]">{g.id}</td>
                  <td className="px-6 py-2 text-[11px] font-black text-right">
                    Rp {g.total.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-2 text-[11px] font-black text-right text-emerald-600">
                    Rp {g.totalApproved.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        g.status.toLowerCase() === 'pending' ? 'bg-amber-50 text-amber-600' : 
                        g.status.toLowerCase() === 'tolak' ? 'bg-red-50 text-red-600' :
                        'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {g.status.toLowerCase() === 'tolak' ? 'DITOLAK' : g.status}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-center">
                    <div className="flex justify-center gap-4">
                      {g.status.toLowerCase() === 'pending' && (
                        <button
                          onClick={() => onEditOrder(g.id)}
                          className="text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onViewDetail(g)}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
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
